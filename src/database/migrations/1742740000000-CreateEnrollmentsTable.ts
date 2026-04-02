import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEnrollmentsTable1742740000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

        school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,

        enrollment_date timestamptz NOT NULL,
        status varchar NOT NULL DEFAULT 'active',

        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_enrollments_student_year
      ON enrollments (student_id, academic_year_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_enrollments_class_id
      ON enrollments (class_id)
    `);

    // One active enrollment per student per academic year.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS UQ_enrollments_active_per_student_year
      ON enrollments (school_id, student_id, academic_year_id)
      WHERE status = 'active' AND deleted_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS UQ_enrollments_active_per_student_year`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_enrollments_class_id`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS IDX_enrollments_student_year`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS enrollments`);
  }
}
