import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class UpdateClassDto {
  @ApiPropertyOptional({ example: 35, description: 'Updated capacity (must be > 0)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440011',
    description: 'New homeroom teacher (must be a teacher role)',
  })
  @IsOptional()
  @IsUUID('4')
  homeroomTeacherId?: string;
}

