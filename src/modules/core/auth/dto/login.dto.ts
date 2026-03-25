import { IsEmail, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ example: 'teacher@school.com' })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'myPassword123' })
    @IsNotEmpty()
    @IsString()
    password: string;

    /**
     * Must match `School.code` for the tenant (same value you use for the customer subdomain / tenant routing).
     * Omit only for platform super-admin login (`school_id` null).
     */
    @ApiPropertyOptional({
        example: 'GREENHS',
        description:
            'School tenant code (matches schools.code). Required for all school users. Maps 1:1 to subdomain in production (e.g. greenhs.yourapp.com → schoolCode GREENHS).',
    })
    @IsOptional()
    @IsString()
    @Length(1, 50)
    schoolCode?: string;
}
