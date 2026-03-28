/**
 * Test fixtures: 2 schools, school_admins, and one platform super_admin.
 * School users: login with schoolCode. Super admin: email + password only (omit schoolCode).
 */
export const SEED_DEFAULT_PASSWORD = 'SchoolAdmin123!';

/** Platform — can create schools, list all schools, etc. Login: email + password only (omit schoolCode). */
export const SEED_SUPER_ADMIN = {
    email: 'carrots.moaz@gmail.com',
    name: { en: 'Moaz Seed', ar: 'معاذ سيد' },
    nationalId: 'SEED-NID-SUPERADMIN-CARROTS-001',
} as const;

export const SEED_SCHOOLS = [
    {
        name: 'Green Hills High',
        code: 'GREENHS',
        email: 'office@greenhs.test',
        phone: '+966500000001',
    },
    {
        name: 'Blue Valley Academy',
        code: 'BLUEVA',
        email: 'office@blueva.test',
        phone: '+966500000002',
    },
] as const;

/** school_admin users — emails are unique per school. */
export const SEED_ADMINS = [
    {
        schoolCode: 'GREENHS',
        email: 'admin@greenhs.test',
        name: { en: 'Sara Al-Mutairi', ar: 'سارة المطيري' },
        nationalId: 'SEED-NID-ADMIN-GREENHS-001',
    },
    {
        schoolCode: 'GREENHS',
        email: 'deputy@greenhs.test',
        name: { en: 'Khalid Al-Fahad', ar: 'خالد الفهد' },
        nationalId: 'SEED-NID-ADMIN-GREENHS-002',
    },
    {
        schoolCode: 'BLUEVA',
        email: 'admin@blueva.test',
        name: { en: 'Omar Al-Harbi', ar: 'عمر الحربي' },
        nationalId: 'SEED-NID-ADMIN-BLUEVA-001',
    },
    {
        schoolCode: 'BLUEVA',
        email: 'deputy@blueva.test',
        name: { en: 'Layla Al-Zahrani', ar: 'ليلى الزهراني' },
        nationalId: 'SEED-NID-ADMIN-BLUEVA-002',
    },
] as const;

/**
 * Stages — Green Hills has all 4, Blue Valley has only KG + Primary.
 * KG stages use manual grade naming; others auto-name.
 */
export const SEED_STAGES = [
    // ── Green Hills ──
    {
        schoolCode: 'GREENHS',
        name: { en: 'Kindergarten', ar: 'روضة' },
        order: 1,
        maxGrades: 2,
        isKindergarten: true,
        gradeNamePrefix: null,
    },
    {
        schoolCode: 'GREENHS',
        name: { en: 'Primary', ar: 'ابتدائي' },
        order: 2,
        maxGrades: 6,
        isKindergarten: false,
        gradeNamePrefix: { en: 'Grade', ar: 'الصف' },
    },
    {
        schoolCode: 'GREENHS',
        name: { en: 'Preparatory', ar: 'إعدادي' },
        order: 3,
        maxGrades: 3,
        isKindergarten: false,
        gradeNamePrefix: { en: 'Grade', ar: 'الصف' },
    },
    {
        schoolCode: 'GREENHS',
        name: { en: 'Secondary', ar: 'ثانوي' },
        order: 4,
        maxGrades: 3,
        isKindergarten: false,
        gradeNamePrefix: { en: 'Grade', ar: 'الصف' },
    },
    // ── Blue Valley ──
    {
        schoolCode: 'BLUEVA',
        name: { en: 'Kindergarten', ar: 'روضة' },
        order: 1,
        maxGrades: 2,
        isKindergarten: true,
        gradeNamePrefix: null,
    },
    {
        schoolCode: 'BLUEVA',
        name: { en: 'Primary', ar: 'ابتدائي' },
        order: 2,
        maxGrades: 6,
        isKindergarten: false,
        gradeNamePrefix: { en: 'Grade', ar: 'الصف' },
    },
] as const;

/**
 * Grade levels per stage.
 * For KG: name provided manually.
 * For non-KG: name auto-computed from gradeStartNumber + order.
 */
export const SEED_GRADE_LEVELS = [
    // ── Green Hills KG ──
    { schoolCode: 'GREENHS', stageName: 'Kindergarten', order: 1, name: { en: 'KG 1', ar: 'روضة 1' } },
    { schoolCode: 'GREENHS', stageName: 'Kindergarten', order: 2, name: { en: 'KG 2', ar: 'روضة 2' } },
    // ── Green Hills Primary (gradeStart=1) ──
    { schoolCode: 'GREENHS', stageName: 'Primary', order: 1, name: { en: 'Grade 1', ar: 'الصف 1' } },
    { schoolCode: 'GREENHS', stageName: 'Primary', order: 2, name: { en: 'Grade 2', ar: 'الصف 2' } },
    { schoolCode: 'GREENHS', stageName: 'Primary', order: 3, name: { en: 'Grade 3', ar: 'الصف 3' } },
    { schoolCode: 'GREENHS', stageName: 'Primary', order: 4, name: { en: 'Grade 4', ar: 'الصف 4' } },
    { schoolCode: 'GREENHS', stageName: 'Primary', order: 5, name: { en: 'Grade 5', ar: 'الصف 5' } },
    { schoolCode: 'GREENHS', stageName: 'Primary', order: 6, name: { en: 'Grade 6', ar: 'الصف 6' } },
    // ── Green Hills Preparatory (gradeStart=7) ──
    { schoolCode: 'GREENHS', stageName: 'Preparatory', order: 1, name: { en: 'Grade 7', ar: 'الصف 7' } },
    { schoolCode: 'GREENHS', stageName: 'Preparatory', order: 2, name: { en: 'Grade 8', ar: 'الصف 8' } },
    { schoolCode: 'GREENHS', stageName: 'Preparatory', order: 3, name: { en: 'Grade 9', ar: 'الصف 9' } },
    // ── Green Hills Secondary (gradeStart=10) ──
    { schoolCode: 'GREENHS', stageName: 'Secondary', order: 1, name: { en: 'Grade 10', ar: 'الصف 10' } },
    { schoolCode: 'GREENHS', stageName: 'Secondary', order: 2, name: { en: 'Grade 11', ar: 'الصف 11' } },
    { schoolCode: 'GREENHS', stageName: 'Secondary', order: 3, name: { en: 'Grade 12', ar: 'الصف 12' } },
    // ── Blue Valley KG ──
    { schoolCode: 'BLUEVA', stageName: 'Kindergarten', order: 1, name: { en: 'KG 1', ar: 'روضة 1' } },
    { schoolCode: 'BLUEVA', stageName: 'Kindergarten', order: 2, name: { en: 'KG 2', ar: 'روضة 2' } },
    // ── Blue Valley Primary (gradeStart=1) ──
    { schoolCode: 'BLUEVA', stageName: 'Primary', order: 1, name: { en: 'Grade 1', ar: 'الصف 1' } },
    { schoolCode: 'BLUEVA', stageName: 'Primary', order: 2, name: { en: 'Grade 2', ar: 'الصف 2' } },
    { schoolCode: 'BLUEVA', stageName: 'Primary', order: 3, name: { en: 'Grade 3', ar: 'الصف 3' } },
    { schoolCode: 'BLUEVA', stageName: 'Primary', order: 4, name: { en: 'Grade 4', ar: 'الصف 4' } },
    { schoolCode: 'BLUEVA', stageName: 'Primary', order: 5, name: { en: 'Grade 5', ar: 'الصف 5' } },
    { schoolCode: 'BLUEVA', stageName: 'Primary', order: 6, name: { en: 'Grade 6', ar: 'الصف 6' } },
] as const;

