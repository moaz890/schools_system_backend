import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { LocalizedStringDto } from '../../../../common/i18n/localized-string.dto';
import { CreateSemesterInAcademicYearDto } from './create-semester-in-academic-year.dto';

export class CreateAcademicYearDto {
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsNotEmpty()
  @IsUUID('4')
  schoolId: string;

  @ApiProperty({ type: LocalizedStringDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  name: LocalizedStringDto;

  @ApiProperty({ example: '2025-09-01T00:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({ example: '2026-06-30T00:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiPropertyOptional({ type: [CreateSemesterInAcademicYearDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSemesterInAcademicYearDto)
  semesters?: CreateSemesterInAcademicYearDto[];
}
