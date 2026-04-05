import { ApiProperty } from '@nestjs/swagger';

export class ContentItemAckResponseDto {
  @ApiProperty({ type: String, format: 'date-time' })
  acknowledgedAt: Date;
}
