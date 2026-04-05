import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class PatchLessonProgressDto {
  @ApiPropertyOptional({
    description: 'Seconds to add to accumulated time spent on this lesson.',
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  additionalTimeSpentSeconds?: number;
}
