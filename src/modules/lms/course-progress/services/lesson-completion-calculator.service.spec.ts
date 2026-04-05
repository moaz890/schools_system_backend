import { LessonContentType } from '../../course-content/enums/lesson-content-type.enum';
import { ContentItem } from '../../course-content/entities/content-item.entity';
import { ContentItemProgress } from '../entities/content-item-progress.entity';
import { LessonCompletionCalculatorService } from './lesson-completion-calculator.service';

describe('LessonCompletionCalculatorService', () => {
  const calc = new LessonCompletionCalculatorService();

  function item(
    id: string,
    type: LessonContentType,
    required: boolean,
    payload: Record<string, unknown> = {},
  ): ContentItem {
    return {
      id,
      lessonId: 'l1',
      position: 0,
      contentType: type,
      isRequired: required,
      payload,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as ContentItem;
  }

  it('treats empty required set as 100%', () => {
    const r = calc.computeForLesson([], new Map());
    expect(r.completionPercentage).toBe(100);
    expect(r.allRequiredDone).toBe(true);
  });

  it('counts VIDEO with duration satisfied at 90% watch by default', () => {
    const items = [
      item('v1', LessonContentType.VIDEO, true, { durationSeconds: 100 }),
    ];
    const map = new Map<string, ContentItemProgress>([
      [
        'v1',
        {
          videoSecondsWatchedMax: 90,
        } as ContentItemProgress,
      ],
    ]);
    const r = calc.computeForLesson(items, map);
    expect(r.allRequiredDone).toBe(true);
  });

  it('requires acknowledgement for VIDEO without duration', () => {
    const items = [item('v1', LessonContentType.VIDEO, true, {})];
    const map = new Map<string, ContentItemProgress>([
      [
        'v1',
        { videoSecondsWatchedMax: 999 } as ContentItemProgress,
      ],
    ]);
    const r = calc.computeForLesson(items, map);
    expect(r.allRequiredDone).toBe(false);

    map.set('v1', {
      videoSecondsWatchedMax: 0,
      acknowledgedAt: new Date(),
    } as ContentItemProgress);
    const r2 = calc.computeForLesson(items, map);
    expect(r2.allRequiredDone).toBe(true);
  });

  it('requires acknowledgement for PDF', () => {
    const items = [item('p1', LessonContentType.PDF, true)];
    expect(calc.computeForLesson(items, new Map()).allRequiredDone).toBe(
      false,
    );
    const map = new Map<string, ContentItemProgress>([
      ['p1', { acknowledgedAt: new Date() } as ContentItemProgress],
    ]);
    expect(calc.computeForLesson(items, map).allRequiredDone).toBe(true);
  });
});
