import { Injectable, NotFoundException } from '@nestjs/common';
import { CourseContentDalService } from '../../course-content/services/course-content-dal.service';
import { CourseLesson } from '../../course-content/entities/course-lesson.entity';

/**
 * Global lesson order: units (by position) → lessons in unit; then root lessons (by position).
 * Matches the structure returned to clients in course content APIs.
 */
@Injectable()
export class CourseLessonOrderService {
  constructor(private readonly contentDal: CourseContentDalService) {}

  sortByPosition<T extends { position: number }>(rows: T[]): T[] {
    return [...rows].sort((a, b) => a.position - b.position);
  }

  async getOrderedLessons(courseId: string): Promise<CourseLesson[]> {
    const units = this.sortByPosition(
      await this.contentDal.listUnitsWithLessonsAndItems(courseId),
    );
    const ordered: CourseLesson[] = [];
    for (const u of units) {
      const lessons = this.sortByPosition(u.lessons ?? []);
      ordered.push(...lessons);
    }
    const roots = this.sortByPosition(
      await this.contentDal.listRootLessonsWithItems(courseId),
    );
    ordered.push(...roots);
    return ordered;
  }

  async getOrderedLessonIds(courseId: string): Promise<string[]> {
    const lessons = await this.getOrderedLessons(courseId);
    return lessons.map((l) => l.id);
  }
}
