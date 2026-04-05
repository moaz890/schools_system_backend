import { VideoStreamStrategyKey } from '../enums/video-stream-strategy-key.enum';

/**
 * Expected keys inside `content_items.payload` when `content_type = VIDEO`.
 * All URL fields are optional at rest; the streaming factory picks a strategy from what is present.
 */
export interface VideoContentPayload {
  delivery?: VideoStreamStrategyKey;
  durationSeconds?: number;
  /** HLS master playlist */
  hlsManifestUrl?: string;
  /** Progressive file (MP4, WebM, …) */
  mp4Url?: string;
  /** iframe / deep link for external hosts */
  externalUrl?: string;
  provider?: 'youtube' | 'vimeo' | 'generic';
  /** Fraction of duration that counts as “watched” for completion (default 0.9 server-side). */
  completionWatchRatio?: number;
}

export function coerceVideoPayload(
  payload: Record<string, unknown>,
): VideoContentPayload {
  const p = payload as Record<string, unknown>;
  return {
    delivery: p.delivery as VideoContentPayload['delivery'],
    durationSeconds:
      typeof p.durationSeconds === 'number' ? p.durationSeconds : undefined,
    hlsManifestUrl:
      typeof p.hlsManifestUrl === 'string' ? p.hlsManifestUrl : undefined,
    mp4Url: typeof p.mp4Url === 'string' ? p.mp4Url : undefined,
    externalUrl:
      typeof p.externalUrl === 'string' ? p.externalUrl : undefined,
    provider: p.provider as VideoContentPayload['provider'],
    completionWatchRatio:
      typeof p.completionWatchRatio === 'number'
        ? p.completionWatchRatio
        : undefined,
  };
}
