import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordResetColumns1742620000000 implements MigrationInterface {
  name = 'AddPasswordResetColumns1742620000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
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

  public async down(queryRunner: QueryRunner): Promise<void> {
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
