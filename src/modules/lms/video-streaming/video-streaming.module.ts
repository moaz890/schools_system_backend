import { Module } from '@nestjs/common';
import { ExternalProviderStrategy } from './strategies/external-provider.strategy';
import { HlsStreamingStrategy } from './strategies/hls-streaming.strategy';
import { Mp4FallbackStrategy } from './strategies/mp4-fallback.strategy';
import { VideoStreamingStrategyFactory } from './video-streaming-strategy.factory';

@Module({
  providers: [
    HlsStreamingStrategy,
    Mp4FallbackStrategy,
    ExternalProviderStrategy,
    VideoStreamingStrategyFactory,
  ],
  exports: [VideoStreamingStrategyFactory],
})
export class VideoStreamingModule {}
