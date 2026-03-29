import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { LocalizedStringDto } from '../../../../common/i18n/localized-string.dto';

export class CreateSemesterDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsNotEmpty()
  @IsUUID('4')
  academicYearId: string;

  @ApiProperty({ type: LocalizedStringDto })
  @IsNotEmpty()
  name: LocalizedStringDto;

  @ApiProperty({ example: '2026-01-20T00:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({ example: '2026-06-30T00:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;
}
