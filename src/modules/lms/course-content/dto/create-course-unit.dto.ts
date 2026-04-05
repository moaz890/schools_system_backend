import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { LocalizedStringDto } from '../../../../common/i18n/localized-string.dto';

export class CreateCourseUnitDto {
  @ApiPropertyOptional({
    description: 'Order among units; omit to append at end',
    minimum: 0,
  })
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
