/**
 * Seeds 2 schools, super_admin, and school_admin users for local testing.
 *
 * Usage (from `schools-backend`):
 *   npm run seed
 *
 * Requires: DB running, schema applied (migrations or synchronize).
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Client } from 'pg';
import * as bcrypt from 'bcrypt';
import {
    SEED_ADMINS,
    SEED_DEFAULT_PASSWORD,
    SEED_GRADE_LEVELS,
    SEED_SCHOOLS,
    SEED_STAGES,
    SEED_SUPER_ADMIN,
} from './seed-data';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const defaultSettingsJson = JSON.stringify({
    gradingScale: 'letter',
    allowLateSubmissions: true,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 30,
    academicYearStartMonth: 9,
});

async function main() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'schools_platform',
    });

    await client.connect();

    try {
        await client.query('SELECT 1 FROM schools LIMIT 1');
    } catch (e: any) {
        if (e.code === '42P01') {
            console.error(`
Cannot seed: table "schools" does not exist.

Create the schema first, then run this script again:
  1. Ensure PostgreSQL is running and .env DB_* matches your instance.
  2. With DB_SYNCHRONIZE=true in .env, run once: npm run start:dev
     (wait until you see the server listening), then stop it.
  3. Run: npm run seed
`);
            await client.end();
            process.exit(1);
        }
        throw e;
    }

    const passwordHash = await bcrypt.hash(SEED_DEFAULT_PASSWORD, 10);

    const codeToSchoolId = new Map<string, string>();

    for (const s of SEED_SCHOOLS) {
        const existing = await client.query(
            `SELECT id FROM schools WHERE code = $1 AND deleted_at IS NULL`,
            [s.code],
        );
        if (existing.rows.length > 0) {
            const id = String(existing.rows[0].id);
            codeToSchoolId.set(s.code, id);
            console.log(`School "${s.code}" already exists (id=${id}), skipping insert.`);
            continue;
        }

        const ins = await client.query(
            `INSERT INTO schools (name, code, email, phone, address, is_active, settings, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, true, $6::jsonb, NOW(), NOW())
       RETURNING id`,
            [s.name, s.code, s.email, s.phone, 'Seed address', defaultSettingsJson],
        );
        const id = String(ins.rows[0].id);
        codeToSchoolId.set(s.code, id);
        console.log(`Created school "${s.name}" (${s.code}) id=${id}`);
    }

    const superExists = await client.query(
        `SELECT id FROM users WHERE email = $1 AND school_id IS NULL AND deleted_at IS NULL`,
        [SEED_SUPER_ADMIN.email],
    );
    const superNat = await client.query(
        `SELECT id FROM users WHERE national_id = $1 AND deleted_at IS NULL`,
        [SEED_SUPER_ADMIN.nationalId],
    );
    if (superExists.rows.length > 0) {
        console.log(`Super admin "${SEED_SUPER_ADMIN.email}" already exists, skipping.`);
    } else if (superNat.rows.length > 0) {
        console.warn(
            `National ID ${SEED_SUPER_ADMIN.nationalId} already used — skipping super admin.`,
        );
    } else {
        await client.query(
            `INSERT INTO users (
          school_id, email, password_hash, name, phone,
          role, status, national_id, national_id_type,
          failed_login_attempts, locked_until, created_at, updated_at
        ) VALUES (
          NULL, $1, $2, $3::jsonb, NULL,
          'super_admin', 'active', $4, 'national_id',
          0, NULL, NOW(), NOW()
        )`,
            [
                SEED_SUPER_ADMIN.email,
                passwordHash,
                JSON.stringify(SEED_SUPER_ADMIN.name),
                SEED_SUPER_ADMIN.nationalId,
            ],
        );
        console.log(`Created super_admin ${SEED_SUPER_ADMIN.email}`);
    }

    for (const a of SEED_ADMINS) {
        const schoolId = codeToSchoolId.get(a.schoolCode);
        if (schoolId === undefined) {
            console.error(`Unknown school code: ${a.schoolCode}`);
            continue;
        }

        const exists = await client.query(
            `SELECT id FROM users WHERE email = $1 AND school_id = $2 AND deleted_at IS NULL`,
            [a.email, schoolId],
        );
        if (exists.rows.length > 0) {
            console.log(
                `User "${a.email}" already exists for school ${a.schoolCode}, skipping.`,
            );
            continue;
        }

        const nat = await client.query(
            `SELECT id FROM users WHERE national_id = $1 AND deleted_at IS NULL`,
            [a.nationalId],
        );
        if (nat.rows.length > 0) {
            console.warn(
                `National ID ${a.nationalId} already used — skipping ${a.email}.`,
            );
            continue;
        }

        await client.query(
            `INSERT INTO users (
          school_id, email, password_hash, name, phone,
          role, status, national_id, national_id_type,
          failed_login_attempts, locked_until, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4::jsonb, NULL,
          'school_admin', 'active', $5, 'national_id',
          0, NULL, NOW(), NOW()
        )`,
            [
                schoolId,
                a.email,
                passwordHash,
                JSON.stringify(a.name),
                a.nationalId,
            ],
        );
        console.log(
            `Created school_admin ${a.email} for ${a.schoolCode} (school_id=${schoolId})`,
        );
    }

    // ─── Seed Stages ─────────────────────────────────────────────────────────

    // stageKey → stage_id map for grade level seeding
    const stageKeyToId = new Map<string, string>();

    for (const s of SEED_STAGES) {
        const schoolId = codeToSchoolId.get(s.schoolCode);
        if (!schoolId) {
            console.error(`Unknown school code for stage: ${s.schoolCode}`);
            continue;
        }

        const existing = await client.query(
            `SELECT id FROM stages WHERE school_id = $1 AND "order" = $2 AND deleted_at IS NULL`,
            [schoolId, s.order],
        );
        if (existing.rows.length > 0) {
            const id = String(existing.rows[0].id);
            stageKeyToId.set(`${s.schoolCode}:${s.name.en}`, id);
            console.log(`Stage "${s.name.en}" (${s.schoolCode}) already exists, skipping.`);
            continue;
        }

        const ins = await client.query(
            `INSERT INTO stages (school_id, name, "order", max_grades, is_kindergarten, grade_name_prefix, created_at, updated_at)
       VALUES ($1, $2::jsonb, $3, $4, $5, $6::jsonb, NOW(), NOW())
       RETURNING id`,
            [
                schoolId,
                JSON.stringify(s.name),
                s.order,
                s.maxGrades,
                s.isKindergarten,
                s.gradeNamePrefix ? JSON.stringify(s.gradeNamePrefix) : null,
            ],
        );
        const id = String(ins.rows[0].id);
        stageKeyToId.set(`${s.schoolCode}:${s.name.en}`, id);
        console.log(`Created stage "${s.name.en}" (${s.schoolCode}) id=${id}`);
    }

    // ─── Seed Grade Levels ───────────────────────────────────────────────────

    for (const g of SEED_GRADE_LEVELS) {
        const schoolId = codeToSchoolId.get(g.schoolCode);
        if (!schoolId) {
            console.error(`Unknown school code for grade: ${g.schoolCode}`);
            continue;
        }

        const stageId = stageKeyToId.get(`${g.schoolCode}:${g.stageName}`);
        if (!stageId) {
            console.error(`Stage "${g.stageName}" not found for ${g.schoolCode}`);
            continue;
        }

        const existing = await client.query(
            `SELECT id FROM grade_levels WHERE stage_id = $1 AND "order" = $2 AND deleted_at IS NULL`,
            [stageId, g.order],
        );
        if (existing.rows.length > 0) {
            console.log(`Grade "${g.name.en}" (${g.schoolCode}/${g.stageName}) exists, skipping.`);
            continue;
        }

        await client.query(
            `INSERT INTO grade_levels (school_id, stage_id, name, "order", created_at, updated_at)
       VALUES ($1, $2, $3::jsonb, $4, NOW(), NOW())`,
            [schoolId, stageId, JSON.stringify(g.name), g.order],
        );
        console.log(`Created grade "${g.name.en}" in ${g.stageName} (${g.schoolCode})`);
    }

    // ─── Summary ─────────────────────────────────────────────────────────────

    console.log('\n--- Login (POST /api/v1/auth/login) ---');
    console.log(
        `Super admin (no schoolCode): { "email": "${SEED_SUPER_ADMIN.email}", "password": "${SEED_DEFAULT_PASSWORD}" }`,
    );
    console.log(
        `GREENHS admins: admin@… / deputy@… + "schoolCode": "GREENHS"`,
    );
    console.log(
        `BLUEVA admins:  admin@… / deputy@… + "schoolCode": "BLUEVA"`,
    );

    await client.end();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
