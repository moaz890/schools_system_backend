import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

export class QueryClassesDto extends PaginationDto {
  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Filter by grade_level_id',
  })
  @IsOptional()
  @IsUUID('4')
  gradeLevelId?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Filter by academic_year_id',
  })
  @IsOptional()
  @IsUUID('4')
  academicYearId?: string;
}
