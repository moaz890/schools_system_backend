import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * - Primary keys + FKs: integer → uuid (data preserved via mapping columns).
 * - schools.email: partial unique index (active rows only), drops table-level UNIQUE on email if present.
 * - users.school_id → schools.id: ON DELETE CASCADE (hard delete school removes its users; API still uses soft-delete).
 */
export class UuidPrimaryKeysSchoolEmailCascade1742600000000
    implements MigrationInterface
{
    name = 'UuidPrimaryKeysSchoolEmailCascade1742600000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasSchools = await queryRunner.hasTable('schools');
        if (!hasSchools) {
            return;
        }

        const idCol: { data_type: string }[] = await queryRunner.query(
            `SELECT data_type FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'schools' AND column_name = 'id'`,
        );
        if (idCol[0]?.data_type === 'uuid') {
            return;
        }

        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

        await queryRunner.query(
            `DROP INDEX IF EXISTS "UQ_users_school_email_active"`,
        );
        await queryRunner.query(
            `DROP INDEX IF EXISTS "UQ_users_superadmin_email_active"`,
        );

        for (const table of ['sessions', 'parent_student', 'users']) {
            await this.dropForeignKeys(queryRunner, table);
        }

        for (const table of ['sessions', 'parent_student', 'users', 'schools']) {
            await this.dropPrimaryKeys(queryRunner, table);
        }

        await this.dropSchoolEmailUniqueIfSingleColumn(queryRunner);

        // ─── schools: new uuid id ───────────────────────────────────────────
        await queryRunner.query(`
            ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "id_new" uuid
        `);
        await queryRunner.query(`
            UPDATE "schools" SET "id_new" = gen_random_uuid() WHERE "id_new" IS NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "schools" ALTER COLUMN "id_new" SET NOT NULL
        `);

        // ─── users: new ids + school_id uuid ────────────────────────────────
        await queryRunner.query(`
            ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "id_new" uuid
        `);
        await queryRunner.query(`
            UPDATE "users" SET "id_new" = gen_random_uuid() WHERE "id_new" IS NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "users" ALTER COLUMN "id_new" SET NOT NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "school_id_new" uuid
        `);
        await queryRunner.query(`
            UPDATE "users" u
            SET "school_id_new" = s."id_new"
            FROM "schools" s
            WHERE u."school_id" IS NOT NULL AND u."school_id" = s."id"
        `);

        // ─── sessions ───────────────────────────────────────────────────────
        await queryRunner.query(`
            ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "user_id_new" uuid
        `);
        await queryRunner.query(`
            UPDATE "sessions" sess
            SET "user_id_new" = u."id_new"
            FROM "users" u
            WHERE sess."user_id" = u."id"
        `);
        await queryRunner.query(`
            ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "id_new" uuid
        `);
        await queryRunner.query(`
            UPDATE "sessions" SET "id_new" = gen_random_uuid() WHERE "id_new" IS NULL
        `);
        await queryRunner.query(`
            DELETE FROM "sessions" WHERE "user_id_new" IS NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "sessions" ALTER COLUMN "id_new" SET NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "sessions" ALTER COLUMN "user_id_new" SET NOT NULL
        `);

        // ─── parent_student (if empty user_id cols, skip updates — still add cols) ─
        const psExists = await this.tableExists(queryRunner, 'parent_student');
        if (psExists) {
            await queryRunner.query(`
                ALTER TABLE "parent_student" ADD COLUMN IF NOT EXISTS "parent_id_new" uuid
            `);
            await queryRunner.query(`
                UPDATE "parent_student" ps
                SET "parent_id_new" = u."id_new"
                FROM "users" u
                WHERE ps."parent_id" = u."id"
            `);
            await queryRunner.query(`
                ALTER TABLE "parent_student" ADD COLUMN IF NOT EXISTS "student_id_new" uuid
            `);
            await queryRunner.query(`
                UPDATE "parent_student" ps
                SET "student_id_new" = u."id_new"
                FROM "users" u
                WHERE ps."student_id" = u."id"
            `);
            await queryRunner.query(`
                ALTER TABLE "parent_student" ADD COLUMN IF NOT EXISTS "id_new" uuid
            `);
            await queryRunner.query(`
                UPDATE "parent_student" SET "id_new" = gen_random_uuid() WHERE "id_new" IS NULL
            `);
            await queryRunner.query(`
                DELETE FROM "parent_student"
                WHERE "parent_id_new" IS NULL OR "student_id_new" IS NULL
            `);
            await queryRunner.query(`
                ALTER TABLE "parent_student" ALTER COLUMN "id_new" SET NOT NULL
            `);
            await queryRunner.query(`
                ALTER TABLE "parent_student" ALTER COLUMN "parent_id_new" SET NOT NULL
            `);
            await queryRunner.query(`
                ALTER TABLE "parent_student" ALTER COLUMN "student_id_new" SET NOT NULL
            `);
        }

        // Drop old columns (cascades owned sequences for serial)
        await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "sessions" RENAME COLUMN "id_new" TO "id"`);
        await queryRunner.query(
            `ALTER TABLE "sessions" RENAME COLUMN "user_id_new" TO "user_id"`,
        );

        if (psExists) {
            await queryRunner.query(`ALTER TABLE "parent_student" DROP COLUMN "id"`);
            await queryRunner.query(
                `ALTER TABLE "parent_student" DROP COLUMN "parent_id"`,
            );
            await queryRunner.query(
                `ALTER TABLE "parent_student" DROP COLUMN "student_id"`,
            );
            await queryRunner.query(
                `ALTER TABLE "parent_student" RENAME COLUMN "id_new" TO "id"`,
            );
            await queryRunner.query(
                `ALTER TABLE "parent_student" RENAME COLUMN "parent_id_new" TO "parent_id"`,
            );
            await queryRunner.query(
                `ALTER TABLE "parent_student" RENAME COLUMN "student_id_new" TO "student_id"`,
            );
        }

        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "school_id"`);
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "id_new" TO "id"`);
        await queryRunner.query(
            `ALTER TABLE "users" RENAME COLUMN "school_id_new" TO "school_id"`,
        );

        await queryRunner.query(`ALTER TABLE "schools" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "schools" RENAME COLUMN "id_new" TO "id"`);

        await queryRunner.query(
            `ALTER TABLE "schools" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
        );
        await queryRunner.query(
            `ALTER TABLE "sessions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
        );
        if (psExists) {
            await queryRunner.query(
                `ALTER TABLE "parent_student" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
            );
        }

        await queryRunner.query(
            `ALTER TABLE "schools" ADD CONSTRAINT "PK_schools" PRIMARY KEY ("id")`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD CONSTRAINT "PK_users" PRIMARY KEY ("id")`,
        );
        await queryRunner.query(
            `ALTER TABLE "sessions" ADD CONSTRAINT "PK_sessions" PRIMARY KEY ("id")`,
        );
        if (psExists) {
            await queryRunner.query(
                `ALTER TABLE "parent_student" ADD CONSTRAINT "PK_parent_student" PRIMARY KEY ("id")`,
            );
        }

        await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "FK_users_school"
            FOREIGN KEY ("school_id") REFERENCES "schools"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "sessions"
            ADD CONSTRAINT "FK_sessions_user"
            FOREIGN KEY ("user_id") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        if (psExists) {
            await queryRunner.query(`
                ALTER TABLE "parent_student"
                ADD CONSTRAINT "FK_parent_student_parent"
                FOREIGN KEY ("parent_id") REFERENCES "users"("id")
                ON DELETE CASCADE ON UPDATE NO ACTION
            `);
            await queryRunner.query(`
                ALTER TABLE "parent_student"
                ADD CONSTRAINT "FK_parent_student_student"
                FOREIGN KEY ("student_id") REFERENCES "users"("id")
                ON DELETE CASCADE ON UPDATE NO ACTION
            `);
        }

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

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "UQ_schools_email_active"
            ON "schools" ("email")
            WHERE "deleted_at" IS NULL
        `);
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        throw new Error(
            'Down migration not supported: restores integer PKs and data mapping is lossy.',
        );
    }

    private async tableExists(
        queryRunner: QueryRunner,
        name: string,
    ): Promise<boolean> {
        const r = await queryRunner.query(
            `SELECT to_regclass($1) AS reg`,
            [`public.${name}`],
        );
        return r[0]?.reg != null;
    }

    private async dropForeignKeys(
        queryRunner: QueryRunner,
        table: string,
    ): Promise<void> {
        const exists = await this.tableExists(queryRunner, table);
        if (!exists) return;
        const rows: { conname: string }[] = await queryRunner.query(
            `
            SELECT c.conname
            FROM pg_constraint c
            JOIN pg_class t ON c.conrelid = t.oid
            WHERE t.relname = $1 AND c.contype = 'f'
            `,
            [table],
        );
        for (const { conname } of rows) {
            await queryRunner.query(
                `ALTER TABLE "${table}" DROP CONSTRAINT "${conname}"`,
            );
        }
    }

    private async dropPrimaryKeys(
        queryRunner: QueryRunner,
        table: string,
    ): Promise<void> {
        const exists = await this.tableExists(queryRunner, table);
        if (!exists) return;
        const rows: { conname: string }[] = await queryRunner.query(
            `
            SELECT c.conname
            FROM pg_constraint c
            JOIN pg_class t ON c.conrelid = t.oid
            WHERE t.relname = $1 AND c.contype = 'p'
            `,
            [table],
        );
        for (const { conname } of rows) {
            await queryRunner.query(
                `ALTER TABLE "${table}" DROP CONSTRAINT "${conname}"`,
            );
        }
    }

    private async dropSchoolEmailUniqueIfSingleColumn(
        queryRunner: QueryRunner,
    ): Promise<void> {
        const rows: { conname: string }[] = await queryRunner.query(`
            SELECT c.conname
            FROM pg_constraint c
            JOIN pg_class t ON c.conrelid = t.oid
            WHERE t.relname = 'schools'
              AND c.contype = 'u'
              AND array_length(c.conkey, 1) = 1
              AND EXISTS (
                SELECT 1 FROM pg_attribute a
                WHERE a.attrelid = c.conrelid
                  AND a.attnum = c.conkey[1]
                  AND a.attname = 'email'
              )
        `);
        for (const { conname } of rows) {
            await queryRunner.query(
                `ALTER TABLE "schools" DROP CONSTRAINT "${conname}"`,
            );
        }
    }
}
