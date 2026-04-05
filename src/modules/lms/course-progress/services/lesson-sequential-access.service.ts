import { ForbiddenException, Injectable } from '@nestjs/common';
import { Course } from '../../courses/entities/course.entity';
import { CourseLessonOrderService } from './course-lesson-order.service';
import { LessonProgressPersistenceService } from './lesson-progress-persistence.service';

/**
 * When `course.sequentialLearningEnabled`, a lesson is reachable only after the previous
 * ordered lesson has `completed_at` set.
 */
@Injectable()
export class LessonSequentialAccessService {
  constructor(
    private readonly order: CourseLessonOrderService,
    private readonly lessonProgress: LessonProgressPersistenceService,
  ) {}

  async assertLessonReachable(
    course: Course,
    courseId: string,
    lessonId: string,
    courseEnrollmentId: string,
  ): Promise<void> {
    if (!course.sequentialLearningEnabled) {
      return;
    }

    const orderedIds = await this.order.getOrderedLessonIds(courseId);
    const idx = orderedIds.indexOf(lessonId);
    if (idx < 0) {
      return;
    }
    if (idx === 0) {
      return;
    }

    const prevId = orderedIds[idx - 1]!;
    const prev = await this.lessonProgress.findByEnrollmentAndLesson(
      courseEnrollmentId,
      prevId,
    );
    if (!prev?.completedAt) {
      throw new ForbiddenException(
        'Complete the previous lesson in order before accessing this one',
      );
    }
  }
}
