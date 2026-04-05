import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * LMS progress (3.3 Phase 2): lesson-level rows + per–content-item video max seconds.
 */
export class CreateLessonAndContentItemProgress1742810000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS lesson_progress (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        course_enrollment_id uuid NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
        lesson_id uuid NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
        started_at timestamptz,
        completed_at timestamptz,
        completion_percentage smallint NOT NULL DEFAULT 0,
        time_spent_seconds integer NOT NULL DEFAULT 0,
        video_seconds_watched integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz,
        CONSTRAINT CHK_lesson_progress_completion_pct CHECK (
          completion_percentage >= 0 AND completion_percentage <= 100
        )
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS UQ_lesson_progress_enrollment_lesson
      ON lesson_progress (course_enrollment_id, lesson_id)
      WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_lesson_progress_enrollment
      ON lesson_progress (course_enrollment_id)
      WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS content_item_progress (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        course_enrollment_id uuid NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
        content_item_id uuid NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
        video_seconds_watched_max integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz,
        CONSTRAINT CHK_content_item_progress_seconds_nonneg CHECK (
          video_seconds_watched_max >= 0
        )
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS UQ_content_item_progress_enrollment_item
      ON content_item_progress (course_enrollment_id, content_item_id)
      WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_content_item_progress_enrollment
      ON content_item_progress (course_enrollment_id)
      WHERE deleted_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS IDX_content_item_progress_enrollment`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS UQ_content_item_progress_enrollment_item`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS content_item_progress`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_lesson_progress_enrollment`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS UQ_lesson_progress_enrollment_lesson`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS lesson_progress`);
  }
}
