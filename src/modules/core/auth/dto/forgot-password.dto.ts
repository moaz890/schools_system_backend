import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class ForgotPasswordDto {
    @ApiProperty({ example: 'teacher@school.com' })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiPropertyOptional({
        example: 'GREENHS',
        description: 'School tenant code (same as login). Required for school users.',
    })
    @IsOptional()
    @IsString()
    @Length(1, 50)
    schoolCode?: string;
}
