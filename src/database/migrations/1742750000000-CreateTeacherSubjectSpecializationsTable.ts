import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTeacherSubjectSpecializationsTable1742750000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS teacher_subject_specializations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

        school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,

        -- Null/empty means allowed in all stages; otherwise allowed only for listed stages.
        allowed_stage_ids uuid[] NULL,

        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_teacher_subject_specializations_school_subject
      ON teacher_subject_specializations (school_id, subject_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_teacher_subject_specializations_school_teacher
      ON teacher_subject_specializations (school_id, teacher_id)
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS UQ_teacher_subject_specializations_pair
      ON teacher_subject_specializations (school_id, teacher_id, subject_id)
      WHERE deleted_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS UQ_teacher_subject_specializations_pair`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS IDX_teacher_subject_specializations_school_teacher`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS IDX_teacher_subject_specializations_school_subject`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS teacher_subject_specializations`,
    );
  }
}
