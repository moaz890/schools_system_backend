import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsOptional,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CalculationMethod, PromotionPolicy } from '../entities/school-strategy.entity';
import { LocalizedStringDto } from '../../../../common/i18n/localized-string.dto';

class GradeDescriptorDto {
    @ApiPropertyOptional({ example: 85, description: 'Minimum percentage for this band (inclusive)' })
    @IsInt()
    @Min(0)
    @Max(100)
    min: number;

    @ApiPropertyOptional({ example: 100, description: 'Maximum percentage for this band (inclusive)' })
    @IsInt()
    @Min(0)
    @Max(100)
    max: number;

    @ApiPropertyOptional({ type: LocalizedStringDto })
    @ValidateNested()
    @Type(() => LocalizedStringDto)
    label: LocalizedStringDto;
}

export class UpdateSchoolStrategyDto {
    @ApiPropertyOptional({
        enum: CalculationMethod,
        description: 'How grades are calculated (CREDIT_HOURS, TOTAL_POINTS, CUMULATIVE_AVERAGE)',
    })
    @IsOptional()
    @IsEnum(CalculationMethod)
    calculationMethod?: CalculationMethod;

    @ApiPropertyOptional({
        example: 50,
        description: 'Minimum % to pass a subject. Egypt = 50, KSA = 60.',
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(100)
    passingThreshold?: number;

    @ApiPropertyOptional({ example: false, description: 'Round final grade totals?' })
    @IsOptional()
    @IsBoolean()
    enableRounding?: boolean;

    @ApiPropertyOptional({ example: 0, description: 'Decimal places in grade display (0, 1, or 2)' })
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(2)
    decimalPlaces?: number;

    @ApiPropertyOptional({
        example: true,
        description: 'Must student pass the final exam to pass the subject? (Dour Thani logic)',
    })
    @IsOptional()
    @IsBoolean()
    mustPassFinalToPassSubject?: boolean;

    @ApiPropertyOptional({ example: true, description: 'Does this school offer resit/makeup exams?' })
    @IsOptional()
    @IsBoolean()
    allowResit?: boolean;

    @ApiPropertyOptional({
        example: 2,
        description: 'Max failed subjects for resit eligibility. Fail more than this → repeat year.',
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    maxFailedSubjectsForResit?: number;

    @ApiPropertyOptional({
        enum: PromotionPolicy,
        description: 'AUTO | MANUAL | CONDITIONAL',
    })
    @IsOptional()
    @IsEnum(PromotionPolicy)
    promotionPolicy?: PromotionPolicy;

    @ApiPropertyOptional({
        type: [GradeDescriptorDto],
        description: 'Ordered list of grade bands with localized labels',
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => GradeDescriptorDto)
    gradeDescriptors?: GradeDescriptorDto[];
}
