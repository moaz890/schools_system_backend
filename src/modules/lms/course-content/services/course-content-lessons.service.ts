import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthCaller } from '../../../core/users/types/auth-caller.type';
import { CourseStructureKind } from '../enums/course-structure-kind.enum';
import { CourseLesson } from '../entities/course-lesson.entity';
import { CourseContentDalService } from './course-content-dal.service';
import { CourseContentSharedService } from './course-content-shared.service';
import type { CreateCourseLessonDto } from '../dto/create-course-lesson.dto';
import type { UpdateCourseLessonDto } from '../dto/update-course-lesson.dto';
import type { ReorderCourseLessonsDto } from '../dto/reorder-course-lessons.dto';

@Injectable()
export class CourseContentLessonsService {
  constructor(
    private readonly dal: CourseContentDalService,
    private readonly shared: CourseContentSharedService,
  ) {}

  async createLesson(
    courseId: string,
    dto: CreateCourseLessonDto,
    caller: AuthCaller,
  ) {
    const schoolId = this.shared.resolveSchoolId(caller);
    const course = await this.shared.loadCourse(courseId, schoolId);
    this.shared.assertCourseAccess(course, caller);
    this.shared.assertStructuralEditAllowed(course);

    const unitCount = await this.dal.countUnits(courseId);
    const underUnit = dto.unitId != null;

    if (underUnit) {
      if (unitCount === 0) {
        throw new BadRequestException('Create a unit first for nested lessons.');
      }
      const unit = await this.dal.findUnit(courseId, dto.unitId!);
      if (!unit) throw new NotFoundException('Unit not found');
      const position =
        dto.position ?? (await this.dal.nextLessonPositionInUnit(unit.id));
      const lesson = new CourseLesson();
      lesson.courseId = courseId;
      lesson.unitId = unit.id;
      lesson.position = position;
      lesson.title = dto.title;
      lesson.description = dto.description ?? null;
      await this.dal.saveLesson(lesson);
      course.structureKind = CourseStructureKind.NESTED;
      await this.dal.saveCourse(course);
    } else {
      if (unitCount > 0) {
        throw new BadRequestException(
          'This course uses units; add lessons inside a unit, or remove all units first.',
        );
      }
      const position =
        dto.position ?? (await this.dal.nextRootLessonPosition(courseId));
      const lesson = new CourseLesson();
      lesson.courseId = courseId;
      lesson.unitId = null;
      lesson.position = position;
      lesson.title = dto.title;
      lesson.description = dto.description ?? null;
      await this.dal.saveLesson(lesson);
      course.structureKind = CourseStructureKind.FLAT;
      await this.dal.saveCourse(course);
    }

    const c = await this.shared.loadCourse(courseId, schoolId);
    return this.shared.buildStructureDto(courseId, c.structureKind);
  }

  async updateLesson(
    courseId: string,
    lessonId: string,
    dto: UpdateCourseLessonDto,
    caller: AuthCaller,
  ) {
    const schoolId = this.shared.resolveSchoolId(caller);
    const course = await this.shared.loadCourse(courseId, schoolId);
    this.shared.assertCourseAccess(course, caller);

    const lesson = await this.dal.findLesson(courseId, lessonId);
    if (!lesson) throw new NotFoundException('Lesson not found');

    if (dto.title === undefined && dto.description === undefined) {
      throw new BadRequestException('Nothing to update');
    }
    if (dto.title !== undefined) lesson.title = dto.title;
    if (dto.description !== undefined)
      lesson.description = dto.description ?? null;
    await this.dal.saveLesson(lesson);
    return this.shared.buildStructureDto(courseId, course.structureKind);
  }

  async deleteLesson(courseId: string, lessonId: string, caller: AuthCaller) {
    const schoolId = this.shared.resolveSchoolId(caller);
    const course = await this.shared.loadCourse(courseId, schoolId);
    this.shared.assertCourseAccess(course, caller);
    this.shared.assertStructuralEditAllowed(course);

    const lesson = await this.dal.findLesson(courseId, lessonId);
    if (!lesson) throw new NotFoundException('Lesson not found');

    await this.dal.softRemoveLessonCascade(lesson);
    await this.shared.recalcStructureKind(courseId, schoolId);
    const c = await this.shared.loadCourse(courseId, schoolId);
    return this.shared.buildStructureDto(courseId, c.structureKind);
  }

  async reorderLessons(
    courseId: string,
    dto: ReorderCourseLessonsDto,
    caller: AuthCaller,
  ) {
    const schoolId = this.shared.resolveSchoolId(caller);
    const course = await this.shared.loadCourse(courseId, schoolId);
    this.shared.assertCourseAccess(course, caller);
    this.shared.assertStructuralEditAllowed(course);

    let siblings: CourseLesson[];
    if (dto.unitId != null) {
      const unit = await this.dal.findUnit(courseId, dto.unitId);
      if (!unit) throw new NotFoundException('Unit not found');
      siblings = await this.dal.listLessonsInUnit(unit.id);
    } else {
      siblings = await this.dal.listRootLessonsWithItems(courseId);
    }

    const activeIds = new Set(siblings.map((l) => l.id));
    if (dto.orderedLessonIds.length !== activeIds.size) {
      throw new BadRequestException(
        'orderedLessonIds must list every sibling lesson exactly once',
      );
    }
    for (const id of dto.orderedLessonIds) {
      if (!activeIds.has(id))
        throw new BadRequestException(`Unknown lesson id: ${id}`);
    }
    for (let i = 0; i < dto.orderedLessonIds.length; i++) {
      const l = siblings.find((x) => x.id === dto.orderedLessonIds[i])!;
      l.position = i;
      await this.dal.saveLesson(l);
    }
    return this.shared.buildStructureDto(courseId, course.structureKind);
  }
}
