import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

export class EndTeacherAssignmentDto {
  @ApiPropertyOptional({
    description: 'Defaults to now if omitted.',
    example: '2026-01-15T12:00:00.000Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
}
