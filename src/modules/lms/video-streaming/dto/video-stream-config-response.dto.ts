import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VideoStreamStrategyKey } from '../enums/video-stream-strategy-key.enum';

export class VideoStreamTrackingRulesDto {
  @ApiProperty({
    description:
      'Client must only report non-decreasing seconds; server applies max(existing, reported).',
    example: true,
  })
  monotonicMaxSeconds: boolean;

  @ApiPropertyOptional({
    description: 'Suggested heartbeat interval for progress PATCH (seconds).',
    example: 15,
  })
  suggestedHeartbeatSeconds?: number;
}

export class VideoPlaybackPayloadDto {
  @ApiProperty({ enum: VideoStreamStrategyKey })
  kind: VideoStreamStrategyKey;

  @ApiPropertyOptional({
    description: 'HLS master playlist URL (adaptive streaming).',
  })
  manifestUrl?: string;

  @ApiPropertyOptional({
    description: 'Direct progressive download URL (MP4, etc.).',
  })
  directUrl?: string;

  @ApiPropertyOptional({
    description: 'Embed / external player URL (YouTube, Vimeo, …).',
  })
  embedUrl?: string;

  @ApiPropertyOptional({ example: 'youtube' })
  provider?: string;
}

/**
 * Stable contract for the frontend player (Phase 4). New strategies extend `playback` fields without breaking `strategyKey`.
 */
export class VideoStreamConfigResponseDto {
  @ApiProperty({ enum: VideoStreamStrategyKey })
  strategyKey: VideoStreamStrategyKey;

  @ApiProperty({ type: VideoStreamTrackingRulesDto })
  tracking: VideoStreamTrackingRulesDto;

  @ApiProperty({ type: VideoPlaybackPayloadDto })
  playback: VideoPlaybackPayloadDto;

  @ApiPropertyOptional({
    description: 'Known duration in seconds (caps client-reported progress when set).',
  })
  durationSeconds?: number;
}
