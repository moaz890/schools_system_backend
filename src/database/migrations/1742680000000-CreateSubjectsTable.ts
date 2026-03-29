import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubjectsTable1742680000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS subjects (
                id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                school_id           uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
                name                jsonb NOT NULL,
                code                varchar(32) NOT NULL,
                category            varchar(32) NOT NULL,
                description         jsonb,
                credit_hours        double precision,
                max_points          integer,
                counts_toward_gpa   boolean NOT NULL DEFAULT true,
                "order"             integer NOT NULL DEFAULT 0,
                created_at          timestamptz NOT NULL DEFAULT now(),
                updated_at          timestamptz NOT NULL DEFAULT now(),
                deleted_at          timestamptz
            )
        `);

    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS IDX_subjects_school_id
            ON subjects (school_id)
        `);

    await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS UQ_subjects_school_code
            ON subjects (school_id, code)
            WHERE deleted_at IS NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS UQ_subjects_school_code`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_subjects_school_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS subjects`);
  }
}
