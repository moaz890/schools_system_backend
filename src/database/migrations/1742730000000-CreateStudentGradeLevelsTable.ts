import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStudentGradeLevelsTable1742730000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS student_grade_levels (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

        school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
        grade_level_id uuid NOT NULL REFERENCES grade_levels(id) ON DELETE CASCADE,

        status varchar NOT NULL DEFAULT 'active',

        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_student_grade_levels_student_year
      ON student_grade_levels (student_id, academic_year_id)
    `);

    // One active grade placement per student per academic year.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS UQ_student_grade_levels_active_per_year
      ON student_grade_levels (school_id, student_id, academic_year_id)
      WHERE status = 'active' AND deleted_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS UQ_student_grade_levels_active_per_year`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS IDX_student_grade_levels_student_year`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS student_grade_levels`);
  }
}
