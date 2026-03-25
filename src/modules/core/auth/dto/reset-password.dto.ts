import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsString,
    IsUUID,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator';

export class ResetPasswordDto {
    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    userId: string;

    @ApiProperty({
        description: 'Opaque token from the reset link (query param `token`).',
        minLength: 64,
        maxLength: 128,
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(64)
    @MaxLength(128)
    token: string;

    @ApiProperty({
        minLength: 8,
        description:
            'Must contain 8+ characters, one uppercase, one lowercase, one number, one special character.',
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
        message:
            'Password must contain 8 characters, one uppercase, one lowercase, one number, and one special character',
    })
    newPassword: string;
}
