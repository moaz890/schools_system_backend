import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsObject, IsOptional } from 'class-validator';
import { LessonContentType } from '../enums/lesson-content-type.enum';

export class UpdateContentItemDto {
  @ApiPropertyOptional({ enum: LessonContentType })
  @IsOptional()
  @IsEnum(LessonContentType)
  contentType?: LessonContentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
