import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { LocalizedStringDto } from '../../../../common/i18n/localized-string.dto';
import { CourseCatalogEnrollmentType } from '../../enums/course-catalog-enrollment-type.enum';

export class CreateCourseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsNotEmpty()
  @IsUUID('4')
  classId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsNotEmpty()
  @IsUUID('4')
  subjectId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440010' })
  @IsNotEmpty()
  @IsUUID('4')
  teacherId: string;

  @ApiPropertyOptional({ type: LocalizedStringDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  description?: LocalizedStringDto;

  @ApiPropertyOptional({ type: LocalizedStringDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  objectives?: LocalizedStringDto;

  @ApiPropertyOptional({
    example: 'Course Term 1',
    description: 'Optional label for display (e.g. “Semester 1”, “Term A”).',
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  durationLabel?: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2025-09-01T00:00:00.000Z',
    description: 'Manual start date for the course access window.',
  })
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-01-15T23:59:59.999Z',
    description: 'Manual end date for the course access window.',
  })
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  sequentialLearningEnabled?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({
    enum: CourseCatalogEnrollmentType,
    default: CourseCatalogEnrollmentType.MANDATORY,
    description:
      'Mandatory: all class students are auto-enrolled (including when the course is unpublished). Elective: manual enrollment later.',
  })
  @IsOptional()
  @IsEnum(CourseCatalogEnrollmentType)
  enrollmentType?: CourseCatalogEnrollmentType;
}
