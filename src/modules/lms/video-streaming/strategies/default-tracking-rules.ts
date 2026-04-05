import { VideoStreamTrackingRulesDto } from '../dto/video-stream-config-response.dto';

export const DEFAULT_VIDEO_TRACKING_RULES: VideoStreamTrackingRulesDto = {
  monotonicMaxSeconds: true,
  suggestedHeartbeatSeconds: 15,
};
