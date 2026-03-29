import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * - Drops the `settings` jsonb column from the `schools` table.
 * - Creates the `school_strategies` table (1:1 with schools).
 *
 * Note: The users first_name/last_name → name jsonb migration and
 *       stages/grade_levels table creation are in migration 1742660000000.
 */
export class SchoolStrategiesAndDropSettings1742670000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Create school_strategies table ─────────────────────────────────

    await queryRunner.query(`
            CREATE TYPE calculation_method_enum AS ENUM (
                'CREDIT_HOURS',
                'TOTAL_POINTS',
                'CUMULATIVE_AVERAGE'
            )
        `);

    await queryRunner.query(`
            CREATE TYPE promotion_policy_enum AS ENUM (
                'AUTO',
                'MANUAL',
                'CONDITIONAL'
            )
        `);

    await queryRunner.query(`
            CREATE TABLE school_strategies (
                id                              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
                school_id                       uuid        NOT NULL UNIQUE REFERENCES schools(id) ON DELETE CASCADE,
                calculation_method              calculation_method_enum NOT NULL DEFAULT 'CREDIT_HOURS',
                passing_threshold               integer     NOT NULL DEFAULT 50,
                enable_rounding                 boolean     NOT NULL DEFAULT false,
                decimal_places                  integer     NOT NULL DEFAULT 0,
                must_pass_final_to_pass_subject boolean     NOT NULL DEFAULT true,
                allow_resit                     boolean     NOT NULL DEFAULT true,
                max_failed_subjects_for_resit   integer     NOT NULL DEFAULT 2,
                promotion_policy                promotion_policy_enum NOT NULL DEFAULT 'CONDITIONAL',
                grade_descriptors               jsonb       NOT NULL DEFAULT '[
                    {"min":85,"max":100,"label":{"en":"Excellent","ar":"ممتاز"}},
                    {"min":75,"max":84,"label":{"en":"Very Good","ar":"جيد جداً"}},
                    {"min":65,"max":74,"label":{"en":"Good","ar":"جيد"}},
                    {"min":50,"max":64,"label":{"en":"Pass","ar":"مقبول"}},
                    {"min":0,"max":49,"label":{"en":"Fail","ar":"ضعيف"}}
                ]'::jsonb,
                created_at                      timestamptz NOT NULL DEFAULT now(),
                updated_at                      timestamptz NOT NULL DEFAULT now(),
                deleted_at                      timestamptz
            )
        `);

    // ── 2. Back-fill — create a default strategy for every existing school ─

    await queryRunner.query(`
            INSERT INTO school_strategies (school_id)
            SELECT id FROM schools WHERE deleted_at IS NULL
        `);

    // ── 3. Drop the old settings column ───────────────────────────────────

    await queryRunner.query(`
            ALTER TABLE schools DROP COLUMN IF EXISTS settings
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore settings column with defaults
    await queryRunner.query(`
            ALTER TABLE schools
            ADD COLUMN settings jsonb NOT NULL DEFAULT '{
                "gradingScale": "percentage",
                "allowLateSubmissions": true,
                "maxLoginAttempts": 5,
                "lockoutDurationMinutes": 30,
                "academicYearStartMonth": 9
            }'::jsonb
        `);

    await queryRunner.query(`DROP TABLE IF EXISTS school_strategies`);
    await queryRunner.query(`DROP TYPE IF EXISTS promotion_policy_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS calculation_method_enum`);
  }
}
