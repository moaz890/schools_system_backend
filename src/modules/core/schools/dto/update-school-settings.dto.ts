import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSchoolSettingsDto {
    @ApiPropertyOptional({ enum: ['percentage', 'gpa'] })
    @IsOptional()
    @IsEnum(['percentage', 'gpa'])
    gradingScale?: 'percentage' | 'gpa';

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    allowLateSubmissions?: boolean;

    @ApiPropertyOptional({ minimum: 3, maximum: 10 })
    @IsOptional()
    @IsInt()
    @Min(3)
    @Max(10)
    maxLoginAttempts?: number;

    @ApiPropertyOptional({ minimum: 5, maximum: 120 })
    @IsOptional()
    @IsInt()
    @Min(5)
    @Max(120)
    lockoutDurationMinutes?: number;

    @ApiPropertyOptional({ minimum: 1, maximum: 12, description: 'Month number (1=Jan, 9=Sep)' })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(12)
    academicYearStartMonth?: number;
}
