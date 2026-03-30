/**
 * Seeds 2 schools, super_admin, school_admin users, stages, grade levels,
 * subjects, grade–subject links, and sample assessment profiles (see seed-data.ts).
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
  SEED_GRADE_LEVEL_SUBJECT_LINKS,
  SEED_SCHOOLS,
  SEED_STAGES,
  SEED_STRATEGIES,
  SEED_SUBJECTS,
  SEED_SUBJECT_ASSESSMENT_PROFILES,
  SEED_SUPER_ADMIN,
} from './seed-data';

dotenv.config({ path: path.join(process.cwd(), '.env') });

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
    let id: string;
    if (existing.rows.length > 0) {
      id = String(existing.rows[0].id);
      codeToSchoolId.set(s.code, id);
      console.log(
        `School "${s.code}" already exists (id=${id}), skipping insert.`,
      );
    } else {
      const ins = await client.query(
        `INSERT INTO schools (name, code, email, phone, address, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
           RETURNING id`,
        [s.name, s.code, s.email, s.phone, 'Seed address'],
      );
      id = String(ins.rows[0].id);
      codeToSchoolId.set(s.code, id);
      console.log(`Created school "${s.name}" (${s.code}) id=${id}`);
    }

    // Look up seed-specific strategy config for this school
    const seedStrategy = SEED_STRATEGIES.find((st) => st.schoolCode === s.code);

    // Upsert strategy — uses seed config if available, otherwise falls back to Egyptian defaults
    await client.query(
      `INSERT INTO school_strategies (
                school_id, calculation_method, passing_threshold, enable_rounding,
                decimal_places, must_pass_final_to_pass_subject, allow_resit,
                max_failed_subjects_for_resit, promotion_policy, grade_descriptors
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
             ON CONFLICT (school_id) DO UPDATE SET
                calculation_method              = EXCLUDED.calculation_method,
                passing_threshold               = EXCLUDED.passing_threshold,
                enable_rounding                 = EXCLUDED.enable_rounding,
                decimal_places                  = EXCLUDED.decimal_places,
                must_pass_final_to_pass_subject = EXCLUDED.must_pass_final_to_pass_subject,
                allow_resit                     = EXCLUDED.allow_resit,
                max_failed_subjects_for_resit   = EXCLUDED.max_failed_subjects_for_resit,
                promotion_policy                = EXCLUDED.promotion_policy,
                grade_descriptors               = EXCLUDED.grade_descriptors,
                updated_at                      = NOW()`,
      [
        id,
        seedStrategy?.calculationMethod ?? 'CREDIT_HOURS',
        seedStrategy?.passingThreshold ?? 50,
        seedStrategy?.enableRounding ?? false,
        seedStrategy?.decimalPlaces ?? 0,
        seedStrategy?.mustPassFinalToPassSubject ?? true,
        seedStrategy?.allowResit ?? true,
        seedStrategy?.maxFailedSubjectsForResit ?? 2,
        seedStrategy?.promotionPolicy ?? 'CONDITIONAL',
        JSON.stringify(seedStrategy?.gradeDescriptors ?? []),
      ],
    );
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
    console.log(
      `Super admin "${SEED_SUPER_ADMIN.email}" already exists, skipping.`,
    );
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
      [schoolId, a.email, passwordHash, JSON.stringify(a.name), a.nationalId],
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
      console.log(
        `Stage "${s.name.en}" (${s.schoolCode}) already exists, skipping.`,
      );
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
      console.log(
        `Grade "${g.name.en}" (${g.schoolCode}/${g.stageName}) exists, skipping.`,
      );
      continue;
    }

    await client.query(
      `INSERT INTO grade_levels (school_id, stage_id, name, "order", created_at, updated_at)
       VALUES ($1, $2, $3::jsonb, $4, NOW(), NOW())`,
      [schoolId, stageId, JSON.stringify(g.name), g.order],
    );
    console.log(
      `Created grade "${g.name.en}" in ${g.stageName} (${g.schoolCode})`,
    );
  }

  // ─── Subjects, curriculum links, assessment profiles ─────────────────────

  let subjectsTableMissing = false;
  try {
    await client.query('SELECT 1 FROM subjects LIMIT 1');
  } catch (e: any) {
    if (e.code === '42P01') {
      subjectsTableMissing = true;
      console.warn(
        '\nSkipping subject seed: table "subjects" does not exist. Run migrations, then npm run seed again.',
      );
    } else {
      throw e;
    }
  }

  if (!subjectsTableMissing) {
    const schoolCodesList = SEED_SCHOOLS.map((s) => s.code);

    const glRows = await client.query(
      `SELECT gl.id, sch.code AS school_code, st.name->>'en' AS stage_en, gl."order" AS grade_order
       FROM grade_levels gl
       INNER JOIN schools sch ON sch.id = gl.school_id AND sch.deleted_at IS NULL
       INNER JOIN stages st ON st.id = gl.stage_id AND st.deleted_at IS NULL
       WHERE sch.code = ANY($1::text[]) AND gl.deleted_at IS NULL`,
      [schoolCodesList],
    );
    const gradeKeyToId = new Map<string, string>();
    for (const row of glRows.rows) {
      gradeKeyToId.set(
        `${row.school_code}:${row.stage_en}:${row.grade_order}`,
        String(row.id),
      );
    }

    const subjectKeyToId = new Map<string, string>();

    for (const sub of SEED_SUBJECTS) {
      const schoolId = codeToSchoolId.get(sub.schoolCode);
      if (!schoolId) continue;

      const ex = await client.query(
        `SELECT id FROM subjects WHERE school_id = $1 AND code = $2 AND deleted_at IS NULL`,
        [schoolId, sub.code],
      );
      let subjectId: string;
      if (ex.rows.length > 0) {
        subjectId = String(ex.rows[0].id);
        subjectKeyToId.set(`${sub.schoolCode}:${sub.code}`, subjectId);
        console.log(
          `Subject "${sub.code}" (${sub.schoolCode}) already exists, skipping insert.`,
        );
        continue;
      }

      const ins = await client.query(
        `INSERT INTO subjects (school_id, name, code, category, description, credit_hours, max_points, counts_toward_gpa, "order", created_at, updated_at)
         VALUES ($1, $2::jsonb, $3, $4, $5::jsonb, $6, $7, $8, $9, NOW(), NOW())
         RETURNING id`,
        [
          schoolId,
          JSON.stringify(sub.name),
          sub.code,
          sub.category,
          sub.description != null
            ? JSON.stringify(sub.description)
            : null,
          sub.creditHours,
          sub.maxPoints,
          sub.countsTowardGpa,
          sub.order,
        ],
      );
      subjectId = String(ins.rows[0].id);
      subjectKeyToId.set(`${sub.schoolCode}:${sub.code}`, subjectId);
      console.log(`Created subject "${sub.code}" for ${sub.schoolCode}`);
    }

    for (const link of SEED_GRADE_LEVEL_SUBJECT_LINKS) {
      const gk = `${link.schoolCode}:${link.stageName}:${link.gradeOrder}`;
      const sk = `${link.schoolCode}:${link.subjectCode}`;
      const gradeLevelId = gradeKeyToId.get(gk);
      const subjectId = subjectKeyToId.get(sk);
      if (!gradeLevelId || !subjectId) {
        console.warn(
          `Skip curriculum link: grade or subject missing (${gk} → ${link.subjectCode})`,
        );
        continue;
      }
      const dup = await client.query(
        `SELECT id FROM grade_level_subjects WHERE grade_level_id = $1 AND subject_id = $2 AND deleted_at IS NULL`,
        [gradeLevelId, subjectId],
      );
      if (dup.rows.length > 0) continue;

      await client.query(
        `INSERT INTO grade_level_subjects (grade_level_id, subject_id, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())`,
        [gradeLevelId, subjectId],
      );
      console.log(
        `Linked subject ${link.subjectCode} → ${link.schoolCode} ${link.stageName} (order ${link.gradeOrder})`,
      );
    }

    let profilesTableMissing = false;
    try {
      await client.query('SELECT 1 FROM subject_assessment_profiles LIMIT 1');
    } catch (e: any) {
      if (e.code === '42P01') {
        profilesTableMissing = true;
        console.warn(
          'Skipping assessment profile seed: table "subject_assessment_profiles" missing.',
        );
      } else {
        throw e;
      }
    }

    if (!profilesTableMissing) {
      for (const prof of SEED_SUBJECT_ASSESSMENT_PROFILES) {
        const sk = `${prof.schoolCode}:${prof.subjectCode}`;
        const subjectId = subjectKeyToId.get(sk);
        if (!subjectId) {
          console.warn(
            `Skip profile: subject ${prof.subjectCode} (${prof.schoolCode}) not found`,
          );
          continue;
        }
        const existing = await client.query(
          `SELECT id FROM subject_assessment_profiles WHERE subject_id = $1 AND grade_level_id IS NULL AND academic_year_id IS NULL AND deleted_at IS NULL`,
          [subjectId],
        );
        const compJson = JSON.stringify(prof.components);
        if (existing.rows.length > 0) {
          await client.query(
            `UPDATE subject_assessment_profiles SET components = $1::jsonb, updated_at = NOW() WHERE id = $2`,
            [compJson, existing.rows[0].id],
          );
          console.log(
            `Updated assessment profile for ${prof.subjectCode} (${prof.schoolCode})`,
          );
        } else {
          await client.query(
            `INSERT INTO subject_assessment_profiles (subject_id, grade_level_id, academic_year_id, components, created_at, updated_at)
             VALUES ($1, NULL, NULL, $2::jsonb, NOW(), NOW())`,
            [subjectId, compJson],
          );
          console.log(
            `Created assessment profile for ${prof.subjectCode} (${prof.schoolCode})`,
          );
        }
      }
    }
  }

  // ─── Summary ─────────────────────────────────────────────────────────────

  console.log('\n--- Login (POST /api/v1/auth/login) ---');
  console.log(
    `Super admin (no schoolCode): { "email": "${SEED_SUPER_ADMIN.email}", "password": "${SEED_DEFAULT_PASSWORD}" }`,
  );
  console.log(`GREENHS admins: admin@… / deputy@… + "schoolCode": "GREENHS"`);
  console.log(`BLUEVA admins:  admin@… / deputy@… + "schoolCode": "BLUEVA"`);
  console.log(
    '\nSubjects: GET /api/v1/subjects · curriculum: GET /api/v1/grade-levels/:id/subjects',
  );
  console.log(
    'Assessment profile: GET|PUT /api/v1/subjects/:id/assessment-profile',
  );

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
