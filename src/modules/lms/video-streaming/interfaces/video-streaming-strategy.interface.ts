import type { ContentItem } from '../../course-content/entities/content-item.entity';
import type { VideoStreamConfigResponseDto } from '../dto/video-stream-config-response.dto';
import type { VideoStreamStrategyKey } from '../enums/video-stream-strategy-key.enum';

/**
 * OCP: add a new strategy class + register in {@link VideoStreamingStrategyFactory}
 * without changing consumers.
 */
export interface IVideoStreamingStrategy {
  readonly strategyKey: VideoStreamStrategyKey;

  supports(payload: Record<string, unknown>): boolean;

  buildStreamConfig(item: ContentItem): VideoStreamConfigResponseDto;
}
