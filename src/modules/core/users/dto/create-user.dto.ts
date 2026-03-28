import {
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Length,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NationalIdType } from '../entities/user.entity';
import { UserRole } from '../../../../common/enums/user-role.enum';
import { LocalizedStringDto } from '../../../../common/i18n/localized-string.dto';

export class CreateUserDto {
    @ApiProperty({ description: 'School this user belongs to' })
    @IsNotEmpty()
    @IsUUID('4')
    schoolId: string;

    @ApiProperty({ description: 'Role to assign', enum: UserRole })
    @IsNotEmpty()
    @IsEnum(UserRole)
    role: UserRole;

    @ApiProperty({ example: 'user@school.com' })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({
        type: LocalizedStringDto,
        description: 'Full name in en/ar. Example: { en: "Ahmed Rashid", ar: "أحمد راشد" }',
    })
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => LocalizedStringDto)
    name: LocalizedStringDto;

    @ApiPropertyOptional({ example: '+966501234567' })
    @IsOptional()
    @IsString()
    @Length(0, 20)
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
