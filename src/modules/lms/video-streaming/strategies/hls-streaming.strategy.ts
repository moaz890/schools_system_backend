import { Injectable } from '@nestjs/common';
import { ContentItem } from '../../course-content/entities/content-item.entity';
import { VideoStreamConfigResponseDto } from '../dto/video-stream-config-response.dto';
import { VideoStreamStrategyKey } from '../enums/video-stream-strategy-key.enum';
import { IVideoStreamingStrategy } from '../interfaces/video-streaming-strategy.interface';
import { coerceVideoPayload } from '../types/video-content-payload.type';
import { DEFAULT_VIDEO_TRACKING_RULES } from './default-tracking-rules';

@Injectable()
export class HlsStreamingStrategy implements IVideoStreamingStrategy {
  readonly strategyKey = VideoStreamStrategyKey.HLS;

  supports(payload: Record<string, unknown>): boolean {
    const v = coerceVideoPayload(payload);
    if (v.delivery === VideoStreamStrategyKey.HLS) return true;
    return Boolean(v.hlsManifestUrl?.trim());
  }

  buildStreamConfig(item: ContentItem): VideoStreamConfigResponseDto {
    const v = coerceVideoPayload(item.payload);
    const manifestUrl = v.hlsManifestUrl?.trim();
    if (!manifestUrl) {
      throw new Error('HlsStreamingStrategy: missing hlsManifestUrl');
    }
    return {
      strategyKey: VideoStreamStrategyKey.HLS,
      tracking: DEFAULT_VIDEO_TRACKING_RULES,
      playback: {
        kind: VideoStreamStrategyKey.HLS,
        manifestUrl,
      },
      durationSeconds: v.durationSeconds,
    };
  }
}
