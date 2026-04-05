import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthCaller } from '../../../core/users/types/auth-caller.type';
import { UserRole } from '../../../../common/enums/user-role.enum';
import { CourseEnrollmentPersistenceService } from '../../course-enrollments/services/course-enrollment-persistence.service';
import { ContentItemProgress } from '../entities/content-item-progress.entity';
import type {
  CourseProgressOverviewDto,
  LessonProgressOverviewItemDto,
} from '../dto/course-progress-overview.dto';
import { ContentItemProgressPersistenceService } from './content-item-progress-persistence.service';
import { CourseLessonOrderService } from './course-lesson-order.service';
import { LessonCompletionCalculatorService } from './lesson-completion-calculator.service';
import { LessonProgressPersistenceService } from './lesson-progress-persistence.service';

@Injectable()
export class CourseProgressOverviewService {
  constructor(
    private readonly enrollmentPersistence: CourseEnrollmentPersistenceService,
    private readonly order: CourseLessonOrderService,
    private readonly lessonProgress: LessonProgressPersistenceService,
    private readonly itemProgress: ContentItemProgressPersistenceService,
    private readonly calculator: LessonCompletionCalculatorService,
  ) {}

  private resolveSchoolId(caller: AuthCaller): string {
    if (!caller.schoolId) {
      throw new BadRequestException('You must be assigned to a school');
    }
    return caller.schoolId;
  }

  async getStudentCourseProgress(
    courseId: string,
    caller: AuthCaller,
  ): Promise<CourseProgressOverviewDto> {
    if (caller.role !== UserRole.STUDENT) {
      throw new ForbiddenException(
        'Only students can load this progress summary',
      );
    }
    const schoolId = this.resolveSchoolId(caller);
    const course = await this.enrollmentPersistence.findCourseById(
      courseId,
      schoolId,
    );
    if (!course) throw new NotFoundException('Course not found');
    if (!course.isPublished) {
      throw new ForbiddenException('Course is not published');
    }

    const enrollment = await this.enrollmentPersistence.findActiveEnrollment(
      caller.id,
      courseId,
    );
    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this course');
    }

    const orderedLessons = await this.order.getOrderedLessons(courseId);
    const lessonRows = await this.lessonProgress.findAllByEnrollment(
      enrollment.id,
    );
    const rowByLessonId = new Map(lessonRows.map((r) => [r.lessonId, r]));

    const allItemIds = orderedLessons.flatMap((l) =>
      (l.contentItems ?? []).map((i) => i.id),
    );
    const itemMap = await this.itemProgress.findMapForItems(
      enrollment.id,
      allItemIds,
    );

    const lessonsOut: LessonProgressOverviewItemDto[] = [];
    let sumPct = 0;

    for (let i = 0; i < orderedLessons.length; i++) {
      const lesson = orderedLessons[i]!;
      const items = lesson.contentItems ?? [];
      const lessonItemMap = new Map<string, ContentItemProgress>();
      for (const it of items) {
        const row = itemMap.get(it.id);
        if (row) lessonItemMap.set(it.id, row);
      }
      const breakdown = this.calculator.computeForLesson(items, lessonItemMap);
      const lp = rowByLessonId.get(lesson.id);

      const prev = i > 0 ? orderedLessons[i - 1] : undefined;
      const prevRow = prev ? rowByLessonId.get(prev.id) : undefined;
      const lockedBySequentialRule =
        course.sequentialLearningEnabled &&
        i > 0 &&
        !prevRow?.completedAt;

      sumPct += breakdown.completionPercentage;

      lessonsOut.push({
        lessonId: lesson.id,
        orderIndex: i,
        title: lesson.title,
        startedAt: lp?.startedAt ?? null,
        completedAt: lp?.completedAt ?? null,
        completionPercentage: breakdown.completionPercentage,
        requiredItemsTotal: breakdown.requiredTotal,
        requiredItemsDone: breakdown.requiredDone,
        lockedBySequentialRule,
      });
    }

    const courseCompletionPercentage =
      orderedLessons.length > 0
        ? Math.round(sumPct / orderedLessons.length)
        : 100;

    return {
      courseId,
      sequentialLearningEnabled: course.sequentialLearningEnabled,
      courseCompletionPercentage,
      lessons: lessonsOut,
    };
  }
}
