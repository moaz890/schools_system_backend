import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LocalizedStringDto {
    @ApiProperty({ example: 'First Semester' })
    @IsNotEmpty()
    @IsString()
    @MaxLength(120)
    en: string;

    @ApiProperty({ example: 'الفصل الدراسي الأول' })
    @IsNotEmpty()
    @IsString()
    @MaxLength(200)
    ar: string;
}

