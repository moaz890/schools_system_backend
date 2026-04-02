import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * LMS course instance: one row per (school, class, subject) for a term/window.
 * Matches `src/modules/lms/courses/entities/course.entity.ts`.
 */
export class CreateCoursesTable1742780000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

        school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,

        description jsonb,
        objectives jsonb,
        duration_label varchar(120),

        start_date timestamptz NOT NULL,
        end_date timestamptz NOT NULL,

        sequential_learning_enabled boolean NOT NULL DEFAULT false,
        is_published boolean NOT NULL DEFAULT false,

        teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_courses_school_class
      ON courses (school_id, class_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_courses_school_subject
      ON courses (school_id, subject_id)
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS UQ_courses_school_class_subject
      ON courses (school_id, class_id, subject_id)
      WHERE deleted_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS UQ_courses_school_class_subject`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_courses_school_subject`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_courses_school_class`);
    await queryRunner.query(`DROP TABLE IF EXISTS courses`);
  }
}
