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
const seed_data_1 = require("./seed-data");
dotenv.config({ path: path.join(process.cwd(), '.env') });
function seedNationalIds() {
    const ids = new Set();
    ids.add(seed_data_1.SEED_SUPER_ADMIN.nationalId);
    for (const a of seed_data_1.SEED_ADMINS) {
        ids.add(a.nationalId);
    }
    return [...ids];
}
function seedSchoolCodes() {
    return seed_data_1.SEED_SCHOOLS.map((s) => s.code);
}
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
        await client.query('SELECT 1 FROM users LIMIT 1');
    }
    catch (e) {
        if (e.code === '42P01') {
            console.error('Cannot clear seed: tables do not exist.');
            await client.end();
            process.exit(1);
        }
        throw e;
    }
    const nationalIds = seedNationalIds();
    const schoolCodes = seedSchoolCodes();
    const userIdsRes = await client.query(`SELECT id FROM users WHERE national_id = ANY($1::text[]) AND deleted_at IS NULL`, [nationalIds]);
    const userIds = userIdsRes.rows.map((r) => String(r.id));
    if (userIds.length > 0) {
        const delSessions = await client.query(`DELETE FROM sessions WHERE user_id = ANY($1::uuid[])`, [userIds]);
        console.log(`Deleted ${delSessions.rowCount ?? 0} session(s) for seed users.`);
    }
    const delUsers = await client.query(`DELETE FROM users WHERE national_id = ANY($1::text[])`, [nationalIds]);
    console.log(`Deleted ${delUsers.rowCount ?? 0} seed user row(s).`);
    const delSchools = await client.query(`DELETE FROM schools WHERE code = ANY($1::text[]) AND deleted_at IS NULL`, [schoolCodes]);
    console.log(`Deleted ${delSchools.rowCount ?? 0} seed school row(s).`);
    await client.end();
    console.log('Seed data cleared (by national_id + school codes from seed-data).');
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=clear-seed.js.map