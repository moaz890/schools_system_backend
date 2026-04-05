import { BadRequestException } from '@nestjs/common';
import { LessonContentType } from '../course-content/enums/lesson-content-type.enum';
import { ContentItem } from '../course-content/entities/content-item.entity';
import { VideoStreamStrategyKey } from './enums/video-stream-strategy-key.enum';
import { ExternalProviderStrategy } from './strategies/external-provider.strategy';
import { HlsStreamingStrategy } from './strategies/hls-streaming.strategy';
import { Mp4FallbackStrategy } from './strategies/mp4-fallback.strategy';
import { VideoStreamingStrategyFactory } from './video-streaming-strategy.factory';

function makeItem(
  payload: Record<string, unknown>,
  type: LessonContentType = LessonContentType.VIDEO,
): ContentItem {
  return {
    id: 'item-1',
    lessonId: 'les-1',
    position: 0,
    contentType: type,
    isRequired: true,
    payload,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as ContentItem;
}

describe('VideoStreamingStrategyFactory', () => {
  const factory = new VideoStreamingStrategyFactory(
    new HlsStreamingStrategy(),
    new Mp4FallbackStrategy(),
    new ExternalProviderStrategy(),
  );

  it('prefers HLS when manifest URL is present', () => {
    const cfg = factory.resolveForContentItem(
      makeItem({
        hlsManifestUrl: 'https://cdn.example/playlist.m3u8',
        mp4Url: 'https://cdn.example/x.mp4',
      }),
    );
    expect(cfg.strategyKey).toBe(VideoStreamStrategyKey.HLS);
    expect(cfg.playback.manifestUrl).toContain('.m3u8');
  });

  it('uses MP4 when no HLS hint', () => {
    const cfg = factory.resolveForContentItem(
      makeItem({ mp4Url: 'https://cdn.example/lesson.mp4' }),
    );
    expect(cfg.strategyKey).toBe(VideoStreamStrategyKey.MP4);
    expect(cfg.playback.directUrl).toContain('.mp4');
  });

  it('uses external when only externalUrl is set', () => {
    const cfg = factory.resolveForContentItem(
      makeItem({ externalUrl: 'https://youtu.be/abc', provider: 'youtube' }),
    );
    expect(cfg.strategyKey).toBe(VideoStreamStrategyKey.EXTERNAL);
    expect(cfg.playback.embedUrl).toContain('youtu');
  });

  it('rejects non-VIDEO items', () => {
    expect(() =>
      factory.resolveForContentItem(
        makeItem({ mp4Url: 'x' }, LessonContentType.PDF),
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects VIDEO without supported payload', () => {
    expect(() => factory.resolveForContentItem(makeItem({}))).toThrow(
      BadRequestException,
    );
  });
});
