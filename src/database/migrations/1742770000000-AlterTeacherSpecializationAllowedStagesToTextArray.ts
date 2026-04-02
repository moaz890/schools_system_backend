import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * TypeORM binds PostgreSQL uuid[] poorly for some drivers (values become the literal
 * `{"<uuid>"}` string). text[] stores the same UUID strings and serializes reliably.
 */
export class AlterTeacherSpecializationAllowedStagesToTextArray1742770000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const has = await queryRunner.hasColumn(
      'teacher_subject_specializations',
      'allowed_stage_ids',
    );
    if (!has) return;

    await queryRunner.query(`
      ALTER TABLE teacher_subject_specializations
      ALTER COLUMN allowed_stage_ids TYPE text[]
      USING CASE
        WHEN allowed_stage_ids IS NULL THEN NULL
        ELSE allowed_stage_ids::text[]
      END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const has = await queryRunner.hasColumn(
      'teacher_subject_specializations',
      'allowed_stage_ids',
    );
    if (!has) return;

    await queryRunner.query(`
      ALTER TABLE teacher_subject_specializations
      ALTER COLUMN allowed_stage_ids TYPE uuid[]
      USING CASE
        WHEN allowed_stage_ids IS NULL THEN NULL
        ELSE allowed_stage_ids::uuid[]
      END
    `);
  }
}
