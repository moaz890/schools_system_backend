import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsUUID,
    Min,
    ValidateNested,
} from 'class-validator';
import { LocalizedStringDto } from '../../../../common/i18n/localized-string.dto';

export class CreateGradeLevelDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Stage UUID this grade belongs to' })
    @IsNotEmpty()
    @IsUUID('4')
    stageId: string;

    @ApiProperty({ example: 1, description: 'Order within the stage (1-based)' })
    @IsInt()
    @Min(1)
    order: number;

    @ApiPropertyOptional({
        type: LocalizedStringDto,
        description: 'Grade name (required for KG stages, ignored for non-KG — auto-generated)',
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => LocalizedStringDto)
    name?: LocalizedStringDto;
}
