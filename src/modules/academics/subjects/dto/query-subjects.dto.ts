import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../../../common/dto/pagination.dto';
import { SubjectCategory } from '../enums/subject-category.enum';

export class QuerySubjectsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: SubjectCategory })
  @IsOptional()
  @IsEnum(SubjectCategory)
  category?: SubjectCategory;

  @ApiPropertyOptional({
    description: 'Case-insensitive match on code or localized name (en/ar)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
