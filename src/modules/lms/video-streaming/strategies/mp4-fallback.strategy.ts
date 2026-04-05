import { Injectable } from '@nestjs/common';
import { ContentItem } from '../../course-content/entities/content-item.entity';
import { VideoStreamConfigResponseDto } from '../dto/video-stream-config-response.dto';
import { VideoStreamStrategyKey } from '../enums/video-stream-strategy-key.enum';
import { IVideoStreamingStrategy } from '../interfaces/video-streaming-strategy.interface';
import { coerceVideoPayload } from '../types/video-content-payload.type';
import { DEFAULT_VIDEO_TRACKING_RULES } from './default-tracking-rules';

@Injectable()
export class Mp4FallbackStrategy implements IVideoStreamingStrategy {
  readonly strategyKey = VideoStreamStrategyKey.MP4;

  supports(payload: Record<string, unknown>): boolean {
    const v = coerceVideoPayload(payload);
    if (v.delivery === VideoStreamStrategyKey.MP4) return true;
    return Boolean(v.mp4Url?.trim());
  }

  buildStreamConfig(item: ContentItem): VideoStreamConfigResponseDto {
    const v = coerceVideoPayload(item.payload);
    const directUrl = v.mp4Url?.trim();
    if (!directUrl) {
      throw new Error('Mp4FallbackStrategy: missing mp4Url');
    }
    return {
      strategyKey: VideoStreamStrategyKey.MP4,
      tracking: DEFAULT_VIDEO_TRACKING_RULES,
      playback: {
        kind: VideoStreamStrategyKey.MP4,
        directUrl,
      },
      durationSeconds: v.durationSeconds,
    };
  }
}
