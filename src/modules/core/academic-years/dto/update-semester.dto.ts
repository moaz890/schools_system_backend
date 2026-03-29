import { PartialType } from '@nestjs/swagger';
import { CreateSemesterDto } from './create-semester.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateSemesterDto extends PartialType(CreateSemesterDto) {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;
}
