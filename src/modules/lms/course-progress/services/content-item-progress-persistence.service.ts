import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { ContentItemProgress } from '../entities/content-item-progress.entity';

/**
 * Writes and reads `content_item_progress` (video max, acknowledgements).
 */
@Injectable()
export class ContentItemProgressPersistenceService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(ContentItemProgress)
    private readonly repo: Repository<ContentItemProgress>,
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

  /**
   * First acknowledgement wins (idempotent). Creates row if needed.
   */
  async acknowledgeItem(params: {
    courseEnrollmentId: string;
    contentItemId: string;
  }): Promise<{ acknowledgedAt: Date }> {
    const { courseEnrollmentId, contentItemId } = params;

    const rows = await this.dataSource.query<
      Array<{ acknowledged_at: Date }>
    >(
      `INSERT INTO content_item_progress (
         id,
         course_enrollment_id,
         content_item_id,
         video_seconds_watched_max,
         acknowledged_at,
         created_at,
         updated_at
       )
       VALUES (gen_random_uuid(), $1, $2, 0, now(), now(), now())
       ON CONFLICT (course_enrollment_id, content_item_id) WHERE deleted_at IS NULL
       DO UPDATE SET
         acknowledged_at = COALESCE(
           content_item_progress.acknowledged_at,
           EXCLUDED.acknowledged_at
         ),
         updated_at = now()
       RETURNING acknowledged_at`,
      [courseEnrollmentId, contentItemId],
    );

    const at = rows[0]?.acknowledged_at;
    if (!at) {
      const row = await this.repo.findOne({
        where: {
          courseEnrollmentId,
          contentItemId,
        },
      });
      return { acknowledgedAt: row?.acknowledgedAt ?? new Date() };
    }
    return { acknowledgedAt: at };
  }

  async findMapForItems(
    courseEnrollmentId: string,
    contentItemIds: string[],
  ): Promise<Map<string, ContentItemProgress>> {
    if (contentItemIds.length === 0) {
      return new Map();
    }
    const rows = await this.repo.find({
      where: {
        courseEnrollmentId,
        contentItemId: In(contentItemIds),
      },
    });
    return new Map(rows.map((r) => [r.contentItemId, r]));
  }
}
