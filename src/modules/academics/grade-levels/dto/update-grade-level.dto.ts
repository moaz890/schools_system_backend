import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, ValidateNested } from 'class-validator';
import { LocalizedStringDto } from '../../../../common/i18n/localized-string.dto';

export class UpdateGradeLevelDto {
  @ApiPropertyOptional({
    example: 2,
    description: 'New order within the stage',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @ApiPropertyOptional({
    type: LocalizedStringDto,
    description: 'Grade name (only applicable for KG stage grades)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  name?: LocalizedStringDto;
}
