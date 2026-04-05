import { Injectable } from '@nestjs/common';
import { ContentItem } from '../../course-content/entities/content-item.entity';
import { LessonContentType } from '../../course-content/enums/lesson-content-type.enum';
import { coerceVideoPayload } from '../../video-streaming/types/video-content-payload.type';
import { ContentItemProgress } from '../entities/content-item-progress.entity';
import { DEFAULT_VIDEO_COMPLETION_WATCH_RATIO } from '../constants/lesson-completion.constants';

export type LessonCompletionBreakdown = {
  requiredTotal: number;
  requiredDone: number;
  completionPercentage: number;
  allRequiredDone: boolean;
};

/**
 * Pure completion rules: required items only; optional items ignored (3.3).
 */
@Injectable()
export class LessonCompletionCalculatorService {
  computeForLesson(
    items: ContentItem[],
    progressByItemId: Map<string, ContentItemProgress>,
  ): LessonCompletionBreakdown {
    const required = items.filter((i) => i.isRequired);
    const requiredTotal = required.length;
    if (requiredTotal === 0) {
      return {
        requiredTotal: 0,
        requiredDone: 0,
        completionPercentage: 100,
        allRequiredDone: true,
      };
    }

    let done = 0;
    for (const item of required) {
      if (this.isItemSatisfied(item, progressByItemId.get(item.id))) {
        done += 1;
      }
    }

    const completionPercentage = Math.round((done / requiredTotal) * 100);
    return {
      requiredTotal,
      requiredDone: done,
      completionPercentage,
      allRequiredDone: done === requiredTotal,
    };
  }

  isItemSatisfied(
    item: ContentItem,
    row: ContentItemProgress | undefined,
  ): boolean {
    if (!item.isRequired) {
      return true;
    }

    switch (item.contentType) {
      case LessonContentType.VIDEO:
        return this.isVideoSatisfied(item, row);
      case LessonContentType.TEXT:
      case LessonContentType.PDF:
      case LessonContentType.IMAGE:
      case LessonContentType.EXTERNAL_LINK:
        return Boolean(row?.acknowledgedAt);
      default:
        return Boolean(row?.acknowledgedAt);
    }
  }

  private isVideoSatisfied(
    item: ContentItem,
    row: ContentItemProgress | undefined,
  ): boolean {
    const meta = coerceVideoPayload(item.payload);
    const watched = row?.videoSecondsWatchedMax ?? 0;

    if (
      meta.durationSeconds != null &&
      Number.isFinite(meta.durationSeconds) &&
      meta.durationSeconds > 0
    ) {
      let ratio = meta.completionWatchRatio ?? DEFAULT_VIDEO_COMPLETION_WATCH_RATIO;
      ratio = Math.min(1, Math.max(0.05, ratio));
      const needed = Math.ceil(meta.durationSeconds * ratio);
      return watched >= needed;
    }

    return Boolean(row?.acknowledgedAt);
  }
}
