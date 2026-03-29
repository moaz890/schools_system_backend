import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthAuditLogs1742630000000 implements MigrationInterface {
  name = 'CreateAuthAuditLogs1742630000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('auth_audit_logs');
    if (hasTable) return;

    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
            CREATE TABLE "auth_audit_logs" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "created_at" timestamptz NOT NULL DEFAULT now(),
                "updated_at" timestamptz NOT NULL DEFAULT now(),
                "deleted_at" timestamptz NULL,

                "event_type" varchar(80) NOT NULL,
                "success" boolean NOT NULL,

                "user_id" uuid NULL,
                "school_id" uuid NULL,
                "actor_user_id" uuid NULL,

                "ip_address" varchar(45) NULL,
                "user_agent" varchar(300) NULL,
                "message" varchar(500) NULL,
                "metadata" jsonb NULL
            )
        `);

    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_auth_audit_logs_event_type" ON "auth_audit_logs" ("event_type")
        `);
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_auth_audit_logs_user_id" ON "auth_audit_logs" ("user_id")
        `);
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_auth_audit_logs_school_id" ON "auth_audit_logs" ("school_id")
        `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Down migrations are intentionally not supported (data loss).
    throw new Error('Down migration not supported for auth audit logs.');
  }
}
