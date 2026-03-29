import { PartialType } from '@nestjs/swagger';
import { CreateAcademicYearDto } from './create-academic-year.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateAcademicYearDto extends PartialType(CreateAcademicYearDto) {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;
}
