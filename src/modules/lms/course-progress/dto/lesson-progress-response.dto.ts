import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LessonProgressResponseDto {
  @ApiProperty({ format: 'uuid' })
  lessonId: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  startedAt: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  completedAt: Date | null;

  @ApiProperty({ minimum: 0, maximum: 100 })
  completionPercentage: number;

  @ApiProperty()
  timeSpentSeconds: number;

  @ApiProperty({
    description: 'Sum of max seconds watched on VIDEO items in this lesson.',
  })
  videoSecondsWatched: number;
}
