import { Injectable } from '@nestjs/common';
import { ContentItem } from '../../course-content/entities/content-item.entity';
import { VideoStreamConfigResponseDto } from '../dto/video-stream-config-response.dto';
import { VideoStreamStrategyKey } from '../enums/video-stream-strategy-key.enum';
import { IVideoStreamingStrategy } from '../interfaces/video-streaming-strategy.interface';
import { coerceVideoPayload } from '../types/video-content-payload.type';
import { DEFAULT_VIDEO_TRACKING_RULES } from './default-tracking-rules';

@Injectable()
export class ExternalProviderStrategy implements IVideoStreamingStrategy {
  readonly strategyKey = VideoStreamStrategyKey.EXTERNAL;

  supports(payload: Record<string, unknown>): boolean {
    const v = coerceVideoPayload(payload);
    if (v.delivery === VideoStreamStrategyKey.EXTERNAL) return true;
    return Boolean(v.externalUrl?.trim());
  }

  buildStreamConfig(item: ContentItem): VideoStreamConfigResponseDto {
    const v = coerceVideoPayload(item.payload);
    const embedUrl = v.externalUrl?.trim();
    if (!embedUrl) {
      throw new Error('ExternalProviderStrategy: missing externalUrl');
    }
    return {
      strategyKey: VideoStreamStrategyKey.EXTERNAL,
      tracking: {
        ...DEFAULT_VIDEO_TRACKING_RULES,
        suggestedHeartbeatSeconds: 30,
      },
      playback: {
        kind: VideoStreamStrategyKey.EXTERNAL,
        embedUrl,
        provider: v.provider ?? 'generic',
      },
      durationSeconds: v.durationSeconds,
    };
  }
}
