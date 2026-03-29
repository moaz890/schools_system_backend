import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
} from 'class-validator';
import { AssessmentComponentType } from '../enums/assessment-component-type.enum';

export class AssessmentComponentDto {
    @ApiProperty({ example: 'Midterm exam' })
    @IsNotEmpty()
    @IsString()
    @MaxLength(120)
    name: string;

    /** Percentage points; all components must sum to 100. */
    @ApiProperty({ example: 30 })
    @IsNumber()
    @Min(0)
    @Max(100)
    weight: number;

    @ApiProperty({ enum: AssessmentComponentType })
    @IsEnum(AssessmentComponentType)
    type: AssessmentComponentType;

    @ApiPropertyOptional({ description: 'e.g. take best 2 of 3 quizzes' })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    best_of_x?: number;
}
