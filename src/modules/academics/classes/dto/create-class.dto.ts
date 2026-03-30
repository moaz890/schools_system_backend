import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class CreateClassDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsNotEmpty()
  @IsUUID('4')
  gradeLevelId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsNotEmpty()
  @IsUUID('4')
  academicYearId: string;

  @ApiProperty({ example: 30, description: 'Class capacity (must be > 0)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440010' })
  @IsNotEmpty()
  @IsUUID('4')
  homeroomTeacherId: string;
}

