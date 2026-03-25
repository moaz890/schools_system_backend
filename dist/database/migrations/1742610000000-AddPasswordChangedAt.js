"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddPasswordChangedAt1742610000000 = void 0;
class AddPasswordChangedAt1742610000000 {
    name = 'AddPasswordChangedAt1742610000000';
    async up(queryRunner) {
        const hasUsers = await queryRunner.hasTable('users');
        if (!hasUsers) {
            return;
        }
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN IF NOT EXISTS "credential_version" int NOT NULL DEFAULT 1
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            DROP COLUMN IF EXISTS "password_changed_at"
        `);
    }
    async down(queryRunner) {
        const hasUsers = await queryRunner.hasTable('users');
        if (!hasUsers) {
            return;
        }
        await queryRunner.query(`
            ALTER TABLE "users"
            DROP COLUMN IF EXISTS "credential_version"
        `);
    }
}
exports.AddPasswordChangedAt1742610000000 = AddPasswordChangedAt1742610000000;
//# sourceMappingURL=1742610000000-AddPasswordChangedAt.js.map