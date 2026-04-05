import { Injectable } from '@nestjs/common';
import { LessonContentType } from '../../course-content/enums/lesson-content-type.enum';
import { CourseContentDalService } from '../../course-content/services/course-content-dal.service';
import { ContentItemProgressPersistenceService } from './content-item-progress-persistence.service';
import { LessonCompletionCalculatorService } from './lesson-completion-calculator.service';
import { LessonProgressPersistenceService } from './lesson-progress-persistence.service';

/**
 * Recomputes `lesson_progress.completion_percentage` (and video aggregate) from item rows.
 */
@Injectable()
export class LessonProgressCompletionSyncService {
  constructor(
    private readonly contentDal: CourseContentDalService,
    private readonly itemProgress: ContentItemProgressPersistenceService,
    private readonly calculator: LessonCompletionCalculatorService,
    private readonly lessonProgress: LessonProgressPersistenceService,
  ) {}

  async recalculateAndSave(
    courseId: string,
    courseEnrollmentId: string,
    lessonId: string,
  ): Promise<void> {
    const lesson = await this.contentDal.findLessonWithContentItems(
      courseId,
      lessonId,
    );
    if (!lesson) {
      return;
    }

    const items = lesson.contentItems ?? [];
    const ids = items.map((i) => i.id);
    const map = await this.itemProgress.findMapForItems(
      courseEnrollmentId,
      ids,
    );
    const { completionPercentage } = this.calculator.computeForLesson(items, map);

    const row = await this.lessonProgress.ensureRow(
      courseEnrollmentId,
      lessonId,
    );
    row.completionPercentage = completionPercentage;
    row.videoSecondsWatched = items
      .filter((i) => i.contentType === LessonContentType.VIDEO)
      .reduce(
        (sum, i) => sum + (map.get(i.id)?.videoSecondsWatchedMax ?? 0),
        0,
      );
    await this.lessonProgress.save(row);
  }
}
