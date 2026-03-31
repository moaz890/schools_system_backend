import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTeacherAssignmentsTable1742760000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS teacher_assignments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

        school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,

        start_date timestamptz NOT NULL DEFAULT now(),
        end_date timestamptz NULL,
        is_active boolean NOT NULL DEFAULT true,

        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_teacher_assignments_school_class
      ON teacher_assignments (school_id, class_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_teacher_assignments_school_teacher
      ON teacher_assignments (school_id, teacher_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_teacher_assignments_school_subject
      ON teacher_assignments (school_id, subject_id)
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS UQ_teacher_assignments_active_unique
      ON teacher_assignments (school_id, teacher_id, class_id, subject_id)
      WHERE is_active IS TRUE AND deleted_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS UQ_teacher_assignments_active_unique`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS IDX_teacher_assignments_school_subject`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS IDX_teacher_assignments_school_teacher`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS IDX_teacher_assignments_school_class`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS teacher_assignments`);
  }
}

