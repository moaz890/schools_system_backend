import { ApiProperty } from '@nestjs/swagger';

export class VideoProgressResponseDto {
  @ApiProperty({
    description: 'Stored monotonic maximum of client-reported seconds for this item.',
  })
  videoSecondsWatchedMax: number;
}
