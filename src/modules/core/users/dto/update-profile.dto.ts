import { IsOptional, IsString, Length, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LocalizedStringDto } from '../../../../common/i18n/localized-string.dto';

export class UpdateProfileDto {
    @ApiPropertyOptional({ type: LocalizedStringDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => LocalizedStringDto)
    name?: LocalizedStringDto;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(0, 20)
    phone?: string;
}
