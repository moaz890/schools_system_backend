import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class PatchVideoProgressDto {
  @ApiProperty({
    description:
      'Cumulative seconds watched as reported by the client; server stores max(existing, reported), capped by duration when known.',
    example: 42,
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  secondsWatched: number;
}
