import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { EnrollmentStatus } from '../enums/enrollment-status.enum';

export class UpdateEnrollmentDto {
  @ApiProperty({
    example: EnrollmentStatus.TRANSFERRED,
    enum: EnrollmentStatus,
  })
  @IsNotEmpty()
  @IsEnum(EnrollmentStatus)
  status: EnrollmentStatus;
}

