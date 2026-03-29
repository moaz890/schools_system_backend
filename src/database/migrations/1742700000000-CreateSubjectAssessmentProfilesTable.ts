import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubjectAssessmentProfilesTable1742700000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS subject_assessment_profiles (
                id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                subject_id         uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
                grade_level_id     uuid NULL REFERENCES grade_levels(id) ON DELETE CASCADE,
                academic_year_id   uuid NULL REFERENCES academic_years(id) ON DELETE CASCADE,
                components         jsonb NOT NULL DEFAULT '[]',
                created_at         timestamptz NOT NULL DEFAULT now(),
                updated_at         timestamptz NOT NULL DEFAULT now(),
                deleted_at         timestamptz
            )
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS IDX_subject_assessment_profiles_subject_id
            ON subject_assessment_profiles (subject_id)
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS UQ_subject_assessment_profiles_default
            ON subject_assessment_profiles (subject_id)
            WHERE deleted_at IS NULL
              AND grade_level_id IS NULL
              AND academic_year_id IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP INDEX IF EXISTS UQ_subject_assessment_profiles_default`,
        );
        await queryRunner.query(
            `DROP INDEX IF EXISTS IDX_subject_assessment_profiles_subject_id`,
        );
        await queryRunner.query(`DROP TABLE IF EXISTS subject_assessment_profiles`);
    }
}
