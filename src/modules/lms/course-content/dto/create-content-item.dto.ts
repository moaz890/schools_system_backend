import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  Min,
} from 'class-validator';
import { LessonContentType } from '../enums/lesson-content-type.enum';

export class CreateContentItemDto {
  @ApiProperty({ enum: LessonContentType })
  @IsEnum(LessonContentType)
  contentType: LessonContentType;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @ApiProperty({
    description: 'Type-specific fields (body, url, fileUrl, etc.)',
    type: 'object',
    additionalProperties: true,
  })
  @IsObject()
  payload: Record<string, unknown>;
}
