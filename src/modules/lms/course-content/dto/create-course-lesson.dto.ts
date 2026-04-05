import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { LocalizedStringDto } from '../../../../common/i18n/localized-string.dto';

export class CreateCourseLessonDto {
  @ApiPropertyOptional({
    description: 'Required when course is in nested mode; must be omitted in flat mode',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4')
  unitId?: string;

  @ApiPropertyOptional({ description: 'Omit to append at end', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  title: LocalizedStringDto;

  @ApiPropertyOptional({ type: LocalizedStringDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  description?: LocalizedStringDto;
}
