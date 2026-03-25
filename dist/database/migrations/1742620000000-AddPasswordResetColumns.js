"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddPasswordResetColumns1742620000000 = void 0;
class AddPasswordResetColumns1742620000000 {
    name = 'AddPasswordResetColumns1742620000000';
    async up(queryRunner) {
        const hasUsers = await queryRunner.hasTable('users');
        if (!hasUsers) {
            return;
        }
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN IF NOT EXISTS "password_reset_token_hash" character varying(128) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN IF NOT EXISTS "password_reset_expires_at" TIMESTAMPTZ NULL
        `);
    }
    async down(queryRunner) {
        const hasUsers = await queryRunner.hasTable('users');
        if (!hasUsers) {
            return;
        }
        await queryRunner.query(`
            ALTER TABLE "users"
            DROP COLUMN IF EXISTS "password_reset_expires_at"
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            DROP COLUMN IF EXISTS "password_reset_token_hash"
        `);
    }
}
exports.AddPasswordResetColumns1742620000000 = AddPasswordResetColumns1742620000000;
//# sourceMappingURL=1742620000000-AddPasswordResetColumns.js.map