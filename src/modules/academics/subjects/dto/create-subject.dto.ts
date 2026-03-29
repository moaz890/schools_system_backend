import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { LocalizedStringDto } from '../../../../common/i18n/localized-string.dto';
import { SubjectCategory } from '../enums/subject-category.enum';

export class CreateSubjectDto {
  @ApiProperty({ type: LocalizedStringDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  name: LocalizedStringDto;

  @ApiProperty({
    example: 'MATH',
    description: 'Unique per school; letters, digits, underscore, hyphen',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(32)
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: 'code must contain only letters, digits, underscore, or hyphen',
  })
  code: string;

  @ApiProperty({ enum: SubjectCategory, example: SubjectCategory.CORE })
  @IsNotEmpty()
  @IsEnum(SubjectCategory)
  category: SubjectCategory;

  @ApiPropertyOptional({ type: LocalizedStringDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  description?: LocalizedStringDto;

  @ApiPropertyOptional({
    description: 'Used when school uses credit-hour weighted averages',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  creditHours?: number;

  @ApiPropertyOptional({
    description: 'Used when school uses total-points aggregation',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxPoints?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  countsTowardGpa?: boolean;

  @ApiPropertyOptional({
    description: 'Sort order in lists (lower first)',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
