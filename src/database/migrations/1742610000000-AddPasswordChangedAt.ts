import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordChangedAt1742610000000 implements MigrationInterface {
  name = 'AddPasswordChangedAt1742610000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
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

  public async down(queryRunner: QueryRunner): Promise<void> {
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
