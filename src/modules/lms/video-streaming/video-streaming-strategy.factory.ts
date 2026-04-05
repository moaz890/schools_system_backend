import { BadRequestException, Injectable } from '@nestjs/common';
import { ContentItem } from '../course-content/entities/content-item.entity';
import { LessonContentType } from '../course-content/enums/lesson-content-type.enum';
import { VideoStreamConfigResponseDto } from './dto/video-stream-config-response.dto';
import { IVideoStreamingStrategy } from './interfaces/video-streaming-strategy.interface';
import { ExternalProviderStrategy } from './strategies/external-provider.strategy';
import { HlsStreamingStrategy } from './strategies/hls-streaming.strategy';
import { Mp4FallbackStrategy } from './strategies/mp4-fallback.strategy';

/**
 * Resolves the first matching {@link IVideoStreamingStrategy} (order: HLS → MP4 → external).
 */
@Injectable()
export class VideoStreamingStrategyFactory {
  private readonly chain: IVideoStreamingStrategy[];

  constructor(
    hls: HlsStreamingStrategy,
    mp4: Mp4FallbackStrategy,
    external: ExternalProviderStrategy,
  ) {
    this.chain = [hls, mp4, external];
  }

  resolveForContentItem(item: ContentItem): VideoStreamConfigResponseDto {
    if (item.contentType !== LessonContentType.VIDEO) {
      throw new BadRequestException(
        'Stream config is only available for VIDEO content items',
      );
    }

    for (const strategy of this.chain) {
      if (strategy.supports(item.payload)) {
        return strategy.buildStreamConfig(item);
      }
    }

    throw new BadRequestException(
      'VIDEO item is missing a supported payload (hlsManifestUrl, mp4Url, or externalUrl / delivery hint)',
    );
  }
}
