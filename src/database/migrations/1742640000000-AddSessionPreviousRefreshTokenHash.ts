import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Stores the previous bcrypt hash of the refresh token for the session row.
 * Used to detect refresh-token reuse after rotation (replay of old token → revoke all sessions).
 */
export class AddSessionPreviousRefreshTokenHash1742640000000
    implements MigrationInterface
{
    name = 'AddSessionPreviousRefreshTokenHash1742640000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const has = await queryRunner.hasTable('sessions');
        if (!has) return;

        await queryRunner.query(`
            ALTER TABLE "sessions"
            ADD COLUMN IF NOT EXISTS "previous_token_hash" text NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const has = await queryRunner.hasTable('sessions');
        if (!has) return;

        await queryRunner.query(`
            ALTER TABLE "sessions" DROP COLUMN IF EXISTS "previous_token_hash"
        `);
    }
}
