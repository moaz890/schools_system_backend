"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
const pg_1 = require("pg");
const bcrypt = __importStar(require("bcrypt"));
const seed_data_1 = require("./seed-data");
dotenv.config({ path: path.join(process.cwd(), '.env') });
const defaultSettingsJson = JSON.stringify({
    gradingScale: 'letter',
    allowLateSubmissions: true,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 30,
    academicYearStartMonth: 9,
});
async function main() {
    const client = new pg_1.Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'schools_platform',
    });
    await client.connect();
    try {
        await client.query('SELECT 1 FROM schools LIMIT 1');
    }
    catch (e) {
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
    const passwordHash = await bcrypt.hash(seed_data_1.SEED_DEFAULT_PASSWORD, 10);
    const codeToSchoolId = new Map();
    for (const s of seed_data_1.SEED_SCHOOLS) {
        const existing = await client.query(`SELECT id FROM schools WHERE code = $1 AND deleted_at IS NULL`, [s.code]);
        if (existing.rows.length > 0) {
            const id = String(existing.rows[0].id);
            codeToSchoolId.set(s.code, id);
            console.log(`School "${s.code}" already exists (id=${id}), skipping insert.`);
            continue;
        }
        const ins = await client.query(`INSERT INTO schools (name, code, email, phone, address, is_active, settings, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, true, $6::jsonb, NOW(), NOW())
       RETURNING id`, [s.name, s.code, s.email, s.phone, 'Seed address', defaultSettingsJson]);
        const id = String(ins.rows[0].id);
        codeToSchoolId.set(s.code, id);
        console.log(`Created school "${s.name}" (${s.code}) id=${id}`);
    }
    const superExists = await client.query(`SELECT id FROM users WHERE email = $1 AND school_id IS NULL AND deleted_at IS NULL`, [seed_data_1.SEED_SUPER_ADMIN.email]);
    const superNat = await client.query(`SELECT id FROM users WHERE national_id = $1 AND deleted_at IS NULL`, [seed_data_1.SEED_SUPER_ADMIN.nationalId]);
    if (superExists.rows.length > 0) {
        console.log(`Super admin "${seed_data_1.SEED_SUPER_ADMIN.email}" already exists, skipping.`);
    }
    else if (superNat.rows.length > 0) {
        console.warn(`National ID ${seed_data_1.SEED_SUPER_ADMIN.nationalId} already used — skipping super admin.`);
    }
    else {
        await client.query(`INSERT INTO users (
          school_id, email, password_hash, first_name, last_name, phone,
          role, status, national_id, national_id_type,
          failed_login_attempts, locked_until, created_at, updated_at
        ) VALUES (
          NULL, $1, $2, $3, $4, NULL,
          'super_admin', 'active', $5, 'national_id',
          0, NULL, NOW(), NOW()
        )`, [
            seed_data_1.SEED_SUPER_ADMIN.email,
            passwordHash,
            seed_data_1.SEED_SUPER_ADMIN.firstName,
            seed_data_1.SEED_SUPER_ADMIN.lastName,
            seed_data_1.SEED_SUPER_ADMIN.nationalId,
        ]);
        console.log(`Created super_admin ${seed_data_1.SEED_SUPER_ADMIN.email}`);
    }
    for (const a of seed_data_1.SEED_ADMINS) {
        const schoolId = codeToSchoolId.get(a.schoolCode);
        if (schoolId === undefined) {
            console.error(`Unknown school code: ${a.schoolCode}`);
            continue;
        }
        const exists = await client.query(`SELECT id FROM users WHERE email = $1 AND school_id = $2 AND deleted_at IS NULL`, [a.email, schoolId]);
        if (exists.rows.length > 0) {
            console.log(`User "${a.email}" already exists for school ${a.schoolCode}, skipping.`);
            continue;
        }
        const nat = await client.query(`SELECT id FROM users WHERE national_id = $1 AND deleted_at IS NULL`, [a.nationalId]);
        if (nat.rows.length > 0) {
            console.warn(`National ID ${a.nationalId} already used — skipping ${a.email}.`);
            continue;
        }
        await client.query(`INSERT INTO users (
          school_id, email, password_hash, first_name, last_name, phone,
          role, status, national_id, national_id_type,
          failed_login_attempts, locked_until, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, NULL,
          'school_admin', 'active', $6, 'national_id',
          0, NULL, NOW(), NOW()
        )`, [
            schoolId,
            a.email,
            passwordHash,
            a.firstName,
            a.lastName,
            a.nationalId,
        ]);
        console.log(`Created school_admin ${a.email} for ${a.schoolCode} (school_id=${schoolId})`);
    }
    console.log('\n--- Login (POST /api/v1/auth/login) ---');
    console.log(`Super admin (no schoolCode): { "email": "${seed_data_1.SEED_SUPER_ADMIN.email}", "password": "${seed_data_1.SEED_DEFAULT_PASSWORD}" }`);
    console.log(`GREENHS admins: admin@… / deputy@… + "schoolCode": "GREENHS"`);
    console.log(`BLUEVA admins:  admin@… / deputy@… + "schoolCode": "BLUEVA"`);
    await client.end();
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=run-seed.js.map