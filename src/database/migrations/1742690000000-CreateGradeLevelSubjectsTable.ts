import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGradeLevelSubjectsTable1742690000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS grade_level_subjects (
                id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                grade_level_id   uuid NOT NULL REFERENCES grade_levels(id) ON DELETE CASCADE,
                subject_id       uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
                created_at       timestamptz NOT NULL DEFAULT now(),
                updated_at       timestamptz NOT NULL DEFAULT now(),
                deleted_at       timestamptz
            )
        `);

    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS IDX_grade_level_subjects_grade_level_id
            ON grade_level_subjects (grade_level_id)
        `);

    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS IDX_grade_level_subjects_subject_id
            ON grade_level_subjects (subject_id)
        `);

    await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS UQ_grade_level_subjects_pair
            ON grade_level_subjects (grade_level_id, subject_id)
            WHERE deleted_at IS NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS UQ_grade_level_subjects_pair`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS IDX_grade_level_subjects_subject_id`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS IDX_grade_level_subjects_grade_level_id`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS grade_level_subjects`);
  }
}
