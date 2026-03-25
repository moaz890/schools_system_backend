"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailUniquePerSchool1730150400000 = void 0;
class EmailUniquePerSchool1730150400000 {
    name = 'EmailUniquePerSchool1730150400000';
    async up(queryRunner) {
        const hasUsers = await queryRunner.hasTable('users');
        if (!hasUsers) {
            return;
        }
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_users_email"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key"`);
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
    async down(queryRunner) {
        const hasUsers = await queryRunner.hasTable('users');
        if (!hasUsers) {
            return;
        }
        await queryRunner.query(`DROP INDEX IF EXISTS "UQ_users_school_email_active"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "UQ_users_superadmin_email_active"`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_users_email" UNIQUE ("email")`);
    }
}
exports.EmailUniquePerSchool1730150400000 = EmailUniquePerSchool1730150400000;
//# sourceMappingURL=1730150400000-EmailUniquePerSchool.js.map