import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Replaces the separate first_name / last_name varchar columns on users with
 * a single jsonb column `name` that holds { en: string, ar: string }.
 *
 * Also adds the stages and grade_levels tables introduced in the academics module.
 */
export class UserLocalizedNameAndAcademicsTables1742660000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Migrate users: first_name + last_name → name jsonb ─────────────

    // Add the new column (nullable initially)
    await queryRunner.query(`
            ALTER TABLE users
            ADD COLUMN name jsonb
        `);

    // Back-fill from existing columns (concatenate to English, empty Arabic)
    await queryRunner.query(`
            UPDATE users
            SET name = jsonb_build_object(
                'en', first_name || ' ' || last_name,
                'ar', first_name || ' ' || last_name
            )
            WHERE first_name IS NOT NULL
        `);

    // Make it NOT NULL once populated
    await queryRunner.query(`
            ALTER TABLE users ALTER COLUMN name SET NOT NULL
        `);

    // Drop old columns
    await queryRunner.query(`ALTER TABLE users DROP COLUMN first_name`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN last_name`);

    // ── 2. Create stages table ─────────────────────────────────────────────

    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS stages (
                id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
                school_id       uuid        NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
                name            jsonb       NOT NULL,
                "order"         integer     NOT NULL,
                max_grades      integer     NOT NULL,
                is_kindergarten boolean     NOT NULL DEFAULT false,
                grade_name_prefix jsonb,
                created_at      timestamptz NOT NULL DEFAULT now(),
                updated_at      timestamptz NOT NULL DEFAULT now(),
                deleted_at      timestamptz
            )
        `);

    await queryRunner.query(`
            CREATE UNIQUE INDEX UQ_stages_school_order
            ON stages (school_id, "order")
            WHERE deleted_at IS NULL
        `);

    // ── 3. Create grade_levels table ───────────────────────────────────────

    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS grade_levels (
                id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
                school_id   uuid        NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
                stage_id    uuid        NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
                name        jsonb       NOT NULL,
                "order"     integer     NOT NULL,
                created_at  timestamptz NOT NULL DEFAULT now(),
                updated_at  timestamptz NOT NULL DEFAULT now(),
                deleted_at  timestamptz
            )
        `);

    await queryRunner.query(`
            CREATE UNIQUE INDEX UQ_grade_levels_stage_order
            ON grade_levels (stage_id, "order")
            WHERE deleted_at IS NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ── 3. Drop grade_levels ───────────────────────────────────────────────
    await queryRunner.query(`DROP INDEX IF EXISTS UQ_grade_levels_stage_order`);
    await queryRunner.query(`DROP TABLE IF EXISTS grade_levels`);

    // ── 2. Drop stages ─────────────────────────────────────────────────────
    await queryRunner.query(`DROP INDEX IF EXISTS UQ_stages_school_order`);
    await queryRunner.query(`DROP TABLE IF EXISTS stages`);

    // ── 1. Revert users name → first_name + last_name ──────────────────────
    await queryRunner.query(`
            ALTER TABLE users
            ADD COLUMN first_name varchar(50),
            ADD COLUMN last_name  varchar(50)
        `);

    await queryRunner.query(`
            UPDATE users
            SET
                first_name = split_part(name->>'en', ' ', 1),
                last_name  = substring(name->>'en' FROM position(' ' IN name->>'en') + 1)
        `);

    await queryRunner.query(`
            ALTER TABLE users
            ALTER COLUMN first_name SET NOT NULL,
            ALTER COLUMN last_name  SET NOT NULL
        `);

    await queryRunner.query(`ALTER TABLE users DROP COLUMN name`);
  }
}
