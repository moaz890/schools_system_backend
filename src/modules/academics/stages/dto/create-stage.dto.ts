import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { LocalizedStringDto } from '../../../../common/i18n/localized-string.dto';

export class CreateStageDto {
  @ApiProperty({ type: LocalizedStringDto, description: 'Stage name in en/ar' })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  name: LocalizedStringDto;

  @ApiProperty({
    example: 1,
    description: 'Display order among stages in the school',
  })
  @IsInt()
  @Min(1)
  order: number;

  @ApiProperty({
    example: 6,
    description: 'Maximum number of grade levels allowed',
  })
  @IsInt()
  @Min(1)
  maxGrades: number;

  @ApiProperty({
    example: false,
    description: 'True if this is a kindergarten stage (grades named manually)',
  })
  @IsBoolean()
  isKindergarten: boolean;

  @ApiPropertyOptional({
    type: LocalizedStringDto,
    description:
      'Prefix for auto-naming grades, e.g. { en: "Grade", ar: "الصف" }. Required for non-KG stages.',
  })
  @ValidateIf((o) => !o.isKindergarten)
  @IsNotEmpty({
    message: 'gradeNamePrefix is required for non-kindergarten stages',
  })
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  @IsOptional()
  gradeNamePrefix?: LocalizedStringDto;
}
