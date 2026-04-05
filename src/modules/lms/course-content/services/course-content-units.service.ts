import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthCaller } from '../../../core/users/types/auth-caller.type';
import { CourseStructureKind } from '../enums/course-structure-kind.enum';
import { CourseUnit } from '../entities/course-unit.entity';
import { CourseContentDalService } from './course-content-dal.service';
import { CourseContentSharedService } from './course-content-shared.service';
import type { CreateCourseUnitDto } from '../dto/create-course-unit.dto';
import type { UpdateCourseUnitDto } from '../dto/update-course-unit.dto';
import type { ReorderCourseUnitsDto } from '../dto/reorder-course-units.dto';

@Injectable()
export class CourseContentUnitsService {
  constructor(
    private readonly dal: CourseContentDalService,
    private readonly shared: CourseContentSharedService,
  ) {}

  async createUnit(
    courseId: string,
    dto: CreateCourseUnitDto,
    caller: AuthCaller,
  ) {
    const schoolId = this.shared.resolveSchoolId(caller);
    const course = await this.shared.loadCourse(courseId, schoolId);
    this.shared.assertCourseAccess(course, caller);
    this.shared.assertStructuralEditAllowed(course);

    const rootCount = await this.dal.countRootLessons(courseId);
    if (rootCount > 0) {
      throw new BadRequestException(
        'Cannot add units while the course has root-level lessons. Remove those lessons first.',
      );
    }
    if (course.structureKind === CourseStructureKind.FLAT) {
      throw new BadRequestException('Course is in flat mode; cannot add units.');
    }

    const position =
      dto.position ?? (await this.dal.nextUnitPosition(courseId));

    const unit = new CourseUnit();
    unit.courseId = courseId;
    unit.position = position;
    unit.title = dto.title;
    unit.description = dto.description ?? null;
    await this.dal.saveUnit(unit);

    course.structureKind = CourseStructureKind.NESTED;
    await this.dal.saveCourse(course);

    return this.shared.buildStructureDto(courseId, course.structureKind);
  }

  async updateUnit(
    courseId: string,
    unitId: string,
    dto: UpdateCourseUnitDto,
    caller: AuthCaller,
  ) {
    const schoolId = this.shared.resolveSchoolId(caller);
    const course = await this.shared.loadCourse(courseId, schoolId);
    this.shared.assertCourseAccess(course, caller);

    const unit = await this.dal.findUnit(courseId, unitId);
    if (!unit) throw new NotFoundException('Unit not found');

    if (dto.title === undefined && dto.description === undefined) {
      throw new BadRequestException('Nothing to update');
    }
    if (dto.title !== undefined) unit.title = dto.title;
    if (dto.description !== undefined)
      unit.description = dto.description ?? null;
    await this.dal.saveUnit(unit);
    return this.shared.buildStructureDto(courseId, course.structureKind);
  }

  async deleteUnit(courseId: string, unitId: string, caller: AuthCaller) {
    const schoolId = this.shared.resolveSchoolId(caller);
    const course = await this.shared.loadCourse(courseId, schoolId);
    this.shared.assertCourseAccess(course, caller);
    this.shared.assertStructuralEditAllowed(course);

    const unit = await this.dal.findUnit(courseId, unitId);
    if (!unit) throw new NotFoundException('Unit not found');

    await this.dal.softRemoveUnitCascade(unit);
    await this.shared.recalcStructureKind(courseId, schoolId);
    const c = await this.shared.loadCourse(courseId, schoolId);
    return this.shared.buildStructureDto(courseId, c.structureKind);
  }

  async reorderUnits(
    courseId: string,
    dto: ReorderCourseUnitsDto,
    caller: AuthCaller,
  ) {
    const schoolId = this.shared.resolveSchoolId(caller);
    const course = await this.shared.loadCourse(courseId, schoolId);
    this.shared.assertCourseAccess(course, caller);
    this.shared.assertStructuralEditAllowed(course);

    const units = await this.dal.listUnitsWithLessonsAndItems(courseId);
    const activeIds = new Set(units.map((u) => u.id));
    if (dto.orderedUnitIds.length !== activeIds.size) {
      throw new BadRequestException(
        'orderedUnitIds must list every unit exactly once',
      );
    }
    for (const id of dto.orderedUnitIds) {
      if (!activeIds.has(id))
        throw new BadRequestException(`Unknown unit id: ${id}`);
    }
    for (let i = 0; i < dto.orderedUnitIds.length; i++) {
      const u = units.find((x) => x.id === dto.orderedUnitIds[i])!;
      u.position = i;
      await this.dal.saveUnit(u);
    }
    return this.shared.buildStructureDto(courseId, course.structureKind);
  }
}
