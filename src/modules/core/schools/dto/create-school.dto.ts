import {
    IsBoolean,
    IsEmail,
    IsHexColor,
    IsNotEmpty,
    IsOptional,
    IsPhoneNumber,
    IsString,
    Length,
    MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSchoolDto {
    @ApiProperty({ example: 'Al-Noor Academy' })
    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    name: string;

    @ApiPropertyOptional({ example: 'ALNOOR' })
    @IsNotEmpty()
    @IsString()
    @Length(2, 20)
    code: string;

    @ApiPropertyOptional({ example: 'contact@alnoor.edu' })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiPropertyOptional({ example: '+966501234567' })
    @IsNotEmpty()
    @IsString()
    @MaxLength(20)
    phone: string;

    @ApiPropertyOptional({ example: 'Riyadh, Saudi Arabia' })
    @IsNotEmpty()
    @IsString()
    address: string;

    @ApiPropertyOptional({ example: '#1a56db' })
    @IsOptional()
    @IsHexColor()
    primaryColor?: string;
}
