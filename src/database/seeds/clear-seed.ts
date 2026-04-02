/**
 * Removes rows created by `npm run seed` (same identifiers as seed-data.ts).
 *
 * Usage (from `schools-backend`):
 *   npm run seed:clear
 *
 * Order: delete LMS courses for seed schools → seed academic year per school
 * (cascades semesters, classes, enrollments, student_grade_levels) → sessions
 * → users → seed subjects (cascades links/profiles) → grade_levels → stages → schools.
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Client } from 'pg';
import {
  allSeedNationalIds,
  SEED_ACADEMIC_YEAR_NAME_EN,
  SEED_SCHOOLS,
  SEED_SUBJECTS,
} from './seed-data';

dotenv.config({ path: path.join(process.cwd(), '.env') });

function seedSchoolCodes(): string[] {
  return SEED_SCHOOLS.map((s) => s.code);
}

function seedSubjectCodes(): string[] {
  return [...new Set(SEED_SUBJECTS.map((s) => s.code))];
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

  const nationalIds = allSeedNationalIds();
  const schoolCodes = seedSchoolCodes();

  const schoolIdsRes = await client.query(
    `SELECT id FROM schools WHERE code = ANY($1::text[]) AND deleted_at IS NULL`,
    [schoolCodes],
  );
  const schoolIds = schoolIdsRes.rows.map((r) => String(r.id));

  if (schoolIds.length > 0) {
    try {
      const delCourses = await client.query(
        `DELETE FROM courses WHERE school_id = ANY($1::uuid[])`,
        [schoolIds],
      );
      console.log(
        `Deleted ${delCourses.rowCount ?? 0} LMS course row(s) for seed schools.`,
      );
    } catch (e: any) {
      if (e.code !== '42P01') {
        throw e;
      }
      console.warn('Table "courses" missing — skipping LMS courses delete.');
    }

    try {
      const delYears = await client.query(
        `DELETE FROM academic_years
         WHERE school_id = ANY($1::uuid[])
           AND name->>'en' = $2
           AND deleted_at IS NULL`,
        [schoolIds, SEED_ACADEMIC_YEAR_NAME_EN],
      );
      console.log(
        `Deleted ${delYears.rowCount ?? 0} seed academic year row(s) (cascades classes, enrollments, placements, semesters).`,
      );
    } catch (e: any) {
      if (e.code !== '42P01') {
        throw e;
      }
      console.warn(
        'Table "academic_years" missing — skipping academic year delete.',
      );
    }
  }

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
    console.log(
      `Deleted ${delSessions.rowCount ?? 0} session(s) for seed users.`,
    );
  }

  const delUsers = await client.query(
    `DELETE FROM users WHERE national_id = ANY($1::text[])`,
    [nationalIds],
  );
  console.log(`Deleted ${delUsers.rowCount ?? 0} seed user row(s).`);

  if (schoolIds.length > 0) {
    const subjectCodes = seedSubjectCodes();
    try {
      const delSubjects = await client.query(
        `DELETE FROM subjects WHERE school_id = ANY($1::uuid[]) AND code = ANY($2::text[])`,
        [schoolIds, subjectCodes],
      );
      console.log(
        `Deleted ${delSubjects.rowCount ?? 0} seed subject row(s) (cascades links & profiles).`,
      );
    } catch (e: any) {
      if (e.code !== '42P01') {
        throw e;
      }
      console.warn('Table "subjects" missing — skipping subject delete.');
    }

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
  console.log(
    'Seed data cleared (academic year + national_id + school codes from seed-data).',
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
