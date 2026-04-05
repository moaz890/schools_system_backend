import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthCaller } from '../../../core/users/types/auth-caller.type';
import { UserRole } from '../../../../common/enums/user-role.enum';
import { CourseStructureKind } from '../enums/course-structure-kind.enum';
import { ContentItem } from '../entities/content-item.entity';
import { CourseLesson } from '../entities/course-lesson.entity';
import { CourseContentDalService } from './course-content-dal.service';
import type {
  ContentItemSnippetDto,
  CourseContentStructureDto,
  CourseLessonSnippetDto,
  CourseUnitSnippetDto,
} from '../dto/course-content-structure-response.dto';

/**
 * Cross-cutting helpers: authz guards, structure JSON for API, structure_kind sync.
 * Used by units / lessons / items services and by GET /courses/:id.
 */
@Injectable()
export class CourseContentSharedService {
  constructor(private readonly dal: CourseContentDalService) {}

  resolveSchoolId(caller: AuthCaller): string {
    if (!caller.schoolId) {
      throw new BadRequestException('You must be assigned to a school');
    }
    return caller.schoolId;
  }

  assertCourseAccess(course: { teacherId: string }, caller: AuthCaller): void {
    if (
      (caller.role === UserRole.TEACHER || caller.role === UserRole.SCHOOL_ADMIN) &&
      course.teacherId !== caller.id
    ) {
      throw new ForbiddenException(
        'You can only manage content for your own courses',
      );
    }
  }

  assertStructuralEditAllowed(course: { isPublished: boolean }): void {
    if (course.isPublished) {
      throw new BadRequestException(
        'Structural changes are not allowed while the course is published. Unpublish first.',
      );
    }
  }

  async loadCourse(courseId: string, schoolId: string) {
    const course = await this.dal.findCourse(courseId, schoolId);
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  /** Used by GET /courses/:id (course access already enforced by CoursesService). */
  async getStructureDto(
    courseId: string,
    schoolId: string,
  ): Promise<CourseContentStructureDto> {
    const course = await this.dal.findCourse(courseId, schoolId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return this.buildStructureDto(courseId, course.structureKind);
  }

  sortByPosition<T extends { position: number }>(rows: T[]): T[] {
    return [...rows].sort((a, b) => a.position - b.position);
  }

  mapContentItem(i: ContentItem): ContentItemSnippetDto {
    return {
      id: i.id,
      position: i.position,
      contentType: i.contentType,
      isRequired: i.isRequired,
      payload: i.payload,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    };
  }

  mapLesson(l: CourseLesson): CourseLessonSnippetDto {
    const items = this.sortByPosition(l.contentItems ?? []).map((x) =>
      this.mapContentItem(x),
    );
    return {
      id: l.id,
      position: l.position,
      title: l.title as Record<string, string>,
      description: (l.description as Record<string, string> | null) ?? null,
      unitId: l.unitId,
      contentItems: items,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    };
  }

  async buildStructureDto(
    courseId: string,
    structureKind: CourseStructureKind | null,
  ): Promise<CourseContentStructureDto> {
    const unitsRaw = await this.dal.listUnitsWithLessonsAndItems(courseId);
    const unitsSorted = this.sortByPosition(unitsRaw).map((u) => {
      const lessons = this.sortByPosition(u.lessons ?? []).map((l) =>
        this.mapLesson(l),
      );
      return {
        id: u.id,
        position: u.position,
        title: u.title as Record<string, string>,
        description: (u.description as Record<string, string> | null) ?? null,
        lessons,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      } satisfies CourseUnitSnippetDto;
    });

    const rootsRaw = await this.dal.listRootLessonsWithItems(courseId);
    const rootLessons = this.sortByPosition(rootsRaw).map((l) =>
      this.mapLesson(l),
    );

    return {
      structureKind,
      units: unitsSorted,
      rootLessons,
    };
  }

  async recalcStructureKind(courseId: string, schoolId: string): Promise<void> {
    const course = await this.loadCourse(courseId, schoolId);
    const u = await this.dal.countUnits(courseId);
    const r = await this.dal.countRootLessons(courseId);
    let kind: CourseStructureKind | null = null;
    if (u > 0) kind = CourseStructureKind.NESTED;
    else if (r > 0) kind = CourseStructureKind.FLAT;
    course.structureKind = kind;
    await this.dal.saveCourse(course);
  }
}
