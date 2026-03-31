import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateTeacherAssignmentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID('4')
  classId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID('4')
  teacherId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID('4')
  subjectId: string;

  @ApiPropertyOptional({ example: '2025-09-01T00:00:00.000Z' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;
}
