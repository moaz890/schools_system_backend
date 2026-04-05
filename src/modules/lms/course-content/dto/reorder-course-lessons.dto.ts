import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsOptional, IsUUID } from 'class-validator';

export class ReorderCourseLessonsDto {
  @ApiPropertyOptional({
    description:
      'When set, reorders lessons inside that unit (nested mode). Omit to reorder root lessons (flat mode).',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4')
  unitId?: string;

  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  orderedLessonIds: string[];
}
