/**
 * Removes rows created by `npm run seed` (same identifiers as seed-data.ts).
 *
 * Usage (from `schools-backend`):
 *   npm run seed:clear
 *
 * Order: sessions → users (by seed national_ids) → schools (by seed codes).
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Client } from 'pg';
import {
    SEED_ADMINS,
    SEED_SCHOOLS,
    SEED_SUPER_ADMIN,
} from './seed-data';

dotenv.config({ path: path.join(process.cwd(), '.env') });

function seedNationalIds(): string[] {
    const ids = new Set<string>();
    ids.add(SEED_SUPER_ADMIN.nationalId);
    for (const a of SEED_ADMINS) {
        ids.add(a.nationalId);
    }
    return [...ids];
}

function seedSchoolCodes(): string[] {
    return SEED_SCHOOLS.map((s) => s.code);
}

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
        await client.query('SELECT 1 FROM users LIMIT 1');
    } catch (e: any) {
        if (e.code === '42P01') {
            console.error('Cannot clear seed: tables do not exist.');
            await client.end();
            process.exit(1);
        }
        throw e;
    }

    const nationalIds = seedNationalIds();
    const schoolCodes = seedSchoolCodes();

    const userIdsRes = await client.query(
        `SELECT id FROM users WHERE national_id = ANY($1::text[]) AND deleted_at IS NULL`,
        [nationalIds],
    );
    const userIds = userIdsRes.rows.map((r) => String(r.id));

    if (userIds.length > 0) {
        const delSessions = await client.query(
            `DELETE FROM sessions WHERE user_id = ANY($1::uuid[])`,
            [userIds],
        );
        console.log(`Deleted ${delSessions.rowCount ?? 0} session(s) for seed users.`);
    }

    const delUsers = await client.query(
        `DELETE FROM users WHERE national_id = ANY($1::text[])`,
        [nationalIds],
    );
    console.log(`Deleted ${delUsers.rowCount ?? 0} seed user row(s).`);

    // Look up school IDs for stage/grade cleanup
    const schoolIdsRes = await client.query(
        `SELECT id FROM schools WHERE code = ANY($1::text[]) AND deleted_at IS NULL`,
        [schoolCodes],
    );
    const schoolIds = schoolIdsRes.rows.map((r) => String(r.id));

    if (schoolIds.length > 0) {
        const delGrades = await client.query(
            `DELETE FROM grade_levels WHERE school_id = ANY($1::uuid[])`,
            [schoolIds],
        );
        console.log(`Deleted ${delGrades.rowCount ?? 0} seed grade level row(s).`);

        const delStages = await client.query(
            `DELETE FROM stages WHERE school_id = ANY($1::uuid[])`,
            [schoolIds],
        );
        console.log(`Deleted ${delStages.rowCount ?? 0} seed stage row(s).`);
    }

    const delSchools = await client.query(
        `DELETE FROM schools WHERE code = ANY($1::text[]) AND deleted_at IS NULL`,
        [schoolCodes],
    );
    console.log(`Deleted ${delSchools.rowCount ?? 0} seed school row(s).`);

    await client.end();
    console.log('Seed data cleared (by national_id + school codes from seed-data).');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
