import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * LMS course content: units, lessons, content_items + courses.structure_kind.
 * Matches entities under `src/modules/lms/course-content/entities/`.
 */
export class CreateCourseContentTables1742790000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE courses
      ADD COLUMN IF NOT EXISTS structure_kind varchar(16) NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS course_units (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        position int NOT NULL,
        title jsonb NOT NULL,
        description jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS UQ_course_units_course_position
      ON course_units (course_id, position)
      WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_course_units_course_id
      ON course_units (course_id)
      WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS course_lessons (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        unit_id uuid NULL REFERENCES course_units(id) ON DELETE CASCADE,
        position int NOT NULL,
        title jsonb NOT NULL,
        description jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS UQ_course_lessons_unit_position
      ON course_lessons (unit_id, position)
      WHERE unit_id IS NOT NULL AND deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS UQ_course_lessons_course_position_root
      ON course_lessons (course_id, position)
      WHERE unit_id IS NULL AND deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_course_lessons_course_id
      ON course_lessons (course_id)
      WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS content_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        lesson_id uuid NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
        position int NOT NULL,
        content_type varchar(32) NOT NULL,
        is_required boolean NOT NULL DEFAULT true,
        payload jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS UQ_content_items_lesson_position
      ON content_items (lesson_id, position)
      WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_content_items_lesson_id
      ON content_items (lesson_id)
      WHERE deleted_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_content_items_lesson_id`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS UQ_content_items_lesson_position`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS content_items`);

    await queryRunner.query(`DROP INDEX IF EXISTS IDX_course_lessons_course_id`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS UQ_course_lessons_course_position_root`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS UQ_course_lessons_unit_position`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS course_lessons`);

    await queryRunner.query(`DROP INDEX IF EXISTS IDX_course_units_course_id`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS UQ_course_units_course_position`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS course_units`);

    await queryRunner.query(`
      ALTER TABLE courses DROP COLUMN IF EXISTS structure_kind
    `);
  }
}
