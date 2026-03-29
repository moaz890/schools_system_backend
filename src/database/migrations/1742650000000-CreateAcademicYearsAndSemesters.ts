import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAcademicYearsAndSemesters1742650000000 implements MigrationInterface {
  name = 'CreateAcademicYearsAndSemesters1742650000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasAcademicYears = await queryRunner.hasTable('academic_years');
    const hasSemesters = await queryRunner.hasTable('semesters');
    if (hasAcademicYears && hasSemesters) return;

    await queryRunner.query(`
            CREATE TABLE "academic_years" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "created_at" timestamptz NOT NULL DEFAULT now(),
                "updated_at" timestamptz NOT NULL DEFAULT now(),
                "deleted_at" timestamptz NULL,

                "school_id" uuid NOT NULL,
                "name" jsonb NOT NULL,
                "start_date" timestamptz NOT NULL,
                "end_date" timestamptz NOT NULL,
                "is_current" boolean NOT NULL DEFAULT false,

                CONSTRAINT "FK_academic_years_school"
                  FOREIGN KEY ("school_id") REFERENCES "schools"("id")
                  ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);

    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_academic_years_school_id"
            ON "academic_years" ("school_id")
        `);

    // Only one current academic year per school.
    await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "UQ_academic_years_school_current"
            ON "academic_years" ("school_id")
            WHERE "is_current" IS TRUE AND "deleted_at" IS NULL
        `);

    await queryRunner.query(`
            CREATE TABLE "semesters" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "created_at" timestamptz NOT NULL DEFAULT now(),
                "updated_at" timestamptz NOT NULL DEFAULT now(),
                "deleted_at" timestamptz NULL,

                "academic_year_id" uuid NOT NULL,
                "name" jsonb NOT NULL,
                "start_date" timestamptz NOT NULL,
                "end_date" timestamptz NOT NULL,
                "is_current" boolean NOT NULL DEFAULT false,

                CONSTRAINT "FK_semesters_academic_year"
                  FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id")
                  ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);

    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_semesters_academic_year_id"
            ON "semesters" ("academic_year_id")
        `);

    // Only one current semester per academic year.
    await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "UQ_semesters_year_current"
            ON "semesters" ("academic_year_id")
            WHERE "is_current" IS TRUE AND "deleted_at" IS NULL
        `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Down migrations intentionally not supported for foundations.
    throw new Error(
      'Down migration not supported for academic years/semesters.',
    );
  }
}
