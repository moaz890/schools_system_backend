import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Email is unique per school (tenant), not globally.
 * Super-admin rows (school_id IS NULL) use a separate partial unique index on email.
 */
export class EmailUniquePerSchool1730150400000 implements MigrationInterface {
    name = 'EmailUniquePerSchool1730150400000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasUsers = await queryRunner.hasTable('users');
        if (!hasUsers) {
            return;
        }

        await queryRunner.query(
            `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_users_email"`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key"`,
        );

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_school_email_active"
            ON "users" ("school_id", "email")
            WHERE "school_id" IS NOT NULL AND "deleted_at" IS NULL
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_superadmin_email_active"
            ON "users" ("email")
            WHERE "school_id" IS NULL AND "deleted_at" IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasUsers = await queryRunner.hasTable('users');
        if (!hasUsers) {
            return;
        }

        await queryRunner.query(
            `DROP INDEX IF EXISTS "UQ_users_school_email_active"`,
        );
        await queryRunner.query(
            `DROP INDEX IF EXISTS "UQ_users_superadmin_email_active"`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD CONSTRAINT "UQ_users_email" UNIQUE ("email")`,
        );
    }
}
