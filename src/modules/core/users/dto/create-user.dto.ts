import {
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Length,
    MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NationalIdType } from '../entities/user.entity';

/** Super admin only — always creates a `school_admin` user (role is not sent in the body). */
export class CreateUserDto {
    @ApiProperty({ description: 'School this admin belongs to' })
    @IsNotEmpty()
    @IsUUID('4')
    schoolId: string;

    @ApiProperty({ example: 'admin@school.com' })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'Ahmed' })
    @IsNotEmpty()
    @IsString()
    @MaxLength(50)
    firstName: string;

    @ApiProperty({ example: 'Al-Rashid' })
    @IsNotEmpty()
    @IsString()
    @MaxLength(50)
    lastName: string;

    @ApiPropertyOptional({ example: '+966501234567' })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    phone?: string;

    @ApiProperty({ example: '1234567890', description: 'National ID / Passport / Iqama number' })
    @IsNotEmpty()
    @IsString()
    @Length(5, 50)
    nationalId: string;

    @ApiPropertyOptional({ enum: NationalIdType, default: NationalIdType.NATIONAL_ID })
    @IsOptional()
    @IsEnum(NationalIdType)
    nationalIdType?: NationalIdType;
}
