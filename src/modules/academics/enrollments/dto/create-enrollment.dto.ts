import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateEnrollmentDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsNotEmpty()
  @IsUUID('4')
  classId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsNotEmpty()
  @IsUUID('4')
  studentId: string;

  @ApiPropertyOptional({
    example: '2025-09-01T00:00:00.000Z',
    description: 'Official join date. Defaults to now() if omitted.',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  enrollmentDate?: Date;
}
