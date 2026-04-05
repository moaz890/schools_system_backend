import { ApiProperty } from '@nestjs/swagger';
import type { LocalizedString } from '../../../../common/i18n/localized-string.type';

export class LessonProgressOverviewItemDto {
  @ApiProperty({ format: 'uuid' })
  lessonId: string;

  @ApiProperty({
    description: '0-based index in the global course lesson order.',
  })
  orderIndex: number;

  @ApiProperty({
    description: 'Lesson title (localized JSON as stored).',
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  title: LocalizedString;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  startedAt: Date | null;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  completedAt: Date | null;

  @ApiProperty()
  completionPercentage: number;

  @ApiProperty()
  requiredItemsTotal: number;

  @ApiProperty()
  requiredItemsDone: number;

  @ApiProperty({
    description:
      'When true, the student must complete the prior lesson first (sequential mode).',
  })
  lockedBySequentialRule: boolean;
}

export class CourseProgressOverviewDto {
  @ApiProperty({ format: 'uuid' })
  courseId: string;

  @ApiProperty()
  sequentialLearningEnabled: boolean;

  @ApiProperty({
    description:
      'Mean of per-lesson completion percentages (lessons with no required items count as 100%).',
    minimum: 0,
    maximum: 100,
  })
  courseCompletionPercentage: number;

  @ApiProperty({ type: [LessonProgressOverviewItemDto] })
  lessons: LessonProgressOverviewItemDto[];
}
