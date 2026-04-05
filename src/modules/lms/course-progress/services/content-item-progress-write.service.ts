import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Atomic monotonic max for video seconds (race-safe via single PostgreSQL upsert).
 */
@Injectable()
export class ContentItemProgressWriteService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async applyMonotonicMax(params: {
    courseEnrollmentId: string;
    contentItemId: string;
    reportedSeconds: number;
  }): Promise<{ videoSecondsWatchedMax: number }> {
    const { courseEnrollmentId, contentItemId, reportedSeconds } = params;

    const rows = await this.dataSource.query<
      Array<{ video_seconds_watched_max: string }>
    >(
      `INSERT INTO content_item_progress (
         id,
         course_enrollment_id,
         content_item_id,
         video_seconds_watched_max,
         created_at,
         updated_at
       )
       VALUES (gen_random_uuid(), $1, $2, $3, now(), now())
       ON CONFLICT (course_enrollment_id, content_item_id) WHERE deleted_at IS NULL
       DO UPDATE SET
         video_seconds_watched_max = GREATEST(
           content_item_progress.video_seconds_watched_max,
           EXCLUDED.video_seconds_watched_max
         ),
         updated_at = now()
       RETURNING video_seconds_watched_max`,
      [courseEnrollmentId, contentItemId, reportedSeconds],
    );

    const raw = rows[0]?.video_seconds_watched_max;
    return {
      videoSecondsWatchedMax: raw != null ? Number(raw) : reportedSeconds,
    };
  }
}
