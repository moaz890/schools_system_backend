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

/** One school_admin per school. */
export const SEED_ADMINS = [
  {
    schoolCode: 'GREENHS',
    email: 'admin@greenhs.test',
    name: { en: 'Sara Al-Mutairi', ar: 'سارة المطيري' },
    nationalId: 'SEED-NID-ADMIN-GREENHS-001',
  },
  {
    schoolCode: 'BLUEVA',
    email: 'admin@blueva.test',
    name: { en: 'Omar Al-Harbi', ar: 'عمر الحربي' },
    nationalId: 'SEED-NID-ADMIN-BLUEVA-001',
  },
] as const;

/**
 * School strategies — one per school.
 * GREENHS uses Egyptian MOE defaults (50% pass).
 * BLUEVA uses Saudi-style pass band (60% pass) and total-points subject caps in seed subjects.
 */
export const SEED_STRATEGIES = [
  {
    schoolCode: 'GREENHS',
    calculationMethod: 'CREDIT_HOURS',
    passingThreshold: 50,
    enableRounding: false,
    decimalPlaces: 0,
    mustPassFinalToPassSubject: true,
    allowResit: true,
    maxFailedSubjectsForResit: 2,
    promotionPolicy: 'CONDITIONAL',
    gradeDescriptors: [
      { min: 85, max: 100, label: { en: 'Excellent', ar: 'ممتاز' } },
      { min: 75, max: 84, label: { en: 'Very Good', ar: 'جيد جداً' } },
      { min: 65, max: 74, label: { en: 'Good', ar: 'جيد' } },
      { min: 50, max: 64, label: { en: 'Pass', ar: 'مقبول' } },
      { min: 0, max: 49, label: { en: 'Fail', ar: 'ضعيف' } },
    ],
  },
  {
    schoolCode: 'BLUEVA',
    calculationMethod: 'TOTAL_POINTS',
    passingThreshold: 60,
    enableRounding: true,
    decimalPlaces: 1,
    mustPassFinalToPassSubject: false,
    allowResit: true,
    maxFailedSubjectsForResit: 3,
    promotionPolicy: 'CONDITIONAL',
    gradeDescriptors: [
      { min: 90, max: 100, label: { en: 'Excellent', ar: 'ممتاز' } },
      { min: 80, max: 89, label: { en: 'Very Good', ar: 'جيد جداً' } },
      { min: 70, max: 79, label: { en: 'Good', ar: 'جيد' } },
      { min: 60, max: 69, label: { en: 'Pass', ar: 'مقبول' } },
      { min: 0, max: 59, label: { en: 'Fail', ar: 'راسب' } },
    ],
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
  {
    schoolCode: 'GREENHS',
    stageName: 'Kindergarten',
    order: 1,
    name: { en: 'KG 1', ar: 'روضة 1' },
  },
  {
    schoolCode: 'GREENHS',
    stageName: 'Kindergarten',
    order: 2,
    name: { en: 'KG 2', ar: 'روضة 2' },
  },
  // ── Green Hills Primary (gradeStart=1) ──
  {
    schoolCode: 'GREENHS',
    stageName: 'Primary',
    order: 1,
    name: { en: 'Grade 1', ar: 'الصف 1' },
  },
  {
    schoolCode: 'GREENHS',
    stageName: 'Primary',
    order: 2,
    name: { en: 'Grade 2', ar: 'الصف 2' },
  },
  {
    schoolCode: 'GREENHS',
    stageName: 'Primary',
    order: 3,
    name: { en: 'Grade 3', ar: 'الصف 3' },
  },
  {
    schoolCode: 'GREENHS',
    stageName: 'Primary',
    order: 4,
    name: { en: 'Grade 4', ar: 'الصف 4' },
  },
  {
    schoolCode: 'GREENHS',
    stageName: 'Primary',
    order: 5,
    name: { en: 'Grade 5', ar: 'الصف 5' },
  },
  {
    schoolCode: 'GREENHS',
    stageName: 'Primary',
    order: 6,
    name: { en: 'Grade 6', ar: 'الصف 6' },
  },
  // ── Green Hills Preparatory (gradeStart=7) ──
  {
    schoolCode: 'GREENHS',
    stageName: 'Preparatory',
    order: 1,
    name: { en: 'Grade 7', ar: 'الصف 7' },
  },
  {
    schoolCode: 'GREENHS',
    stageName: 'Preparatory',
    order: 2,
    name: { en: 'Grade 8', ar: 'الصف 8' },
  },
  {
    schoolCode: 'GREENHS',
    stageName: 'Preparatory',
    order: 3,
    name: { en: 'Grade 9', ar: 'الصف 9' },
  },
  // ── Green Hills Secondary (gradeStart=10) ──
  {
    schoolCode: 'GREENHS',
    stageName: 'Secondary',
    order: 1,
    name: { en: 'Grade 10', ar: 'الصف 10' },
  },
  {
    schoolCode: 'GREENHS',
    stageName: 'Secondary',
    order: 2,
    name: { en: 'Grade 11', ar: 'الصف 11' },
  },
  {
    schoolCode: 'GREENHS',
    stageName: 'Secondary',
    order: 3,
    name: { en: 'Grade 12', ar: 'الصف 12' },
  },
  // ── Blue Valley KG ──
  {
    schoolCode: 'BLUEVA',
    stageName: 'Kindergarten',
    order: 1,
    name: { en: 'KG 1', ar: 'روضة 1' },
  },
  {
    schoolCode: 'BLUEVA',
    stageName: 'Kindergarten',
    order: 2,
    name: { en: 'KG 2', ar: 'روضة 2' },
  },
  // ── Blue Valley Primary (gradeStart=1) ──
  {
    schoolCode: 'BLUEVA',
    stageName: 'Primary',
    order: 1,
    name: { en: 'Grade 1', ar: 'الصف 1' },
  },
  {
    schoolCode: 'BLUEVA',
    stageName: 'Primary',
    order: 2,
    name: { en: 'Grade 2', ar: 'الصف 2' },
  },
  {
    schoolCode: 'BLUEVA',
    stageName: 'Primary',
    order: 3,
    name: { en: 'Grade 3', ar: 'الصف 3' },
  },
  {
    schoolCode: 'BLUEVA',
    stageName: 'Primary',
    order: 4,
    name: { en: 'Grade 4', ar: 'الصف 4' },
  },
  {
    schoolCode: 'BLUEVA',
    stageName: 'Primary',
    order: 5,
    name: { en: 'Grade 5', ar: 'الصف 5' },
  },
  {
    schoolCode: 'BLUEVA',
    stageName: 'Primary',
    order: 6,
    name: { en: 'Grade 6', ar: 'الصف 6' },
  },
] as const;

/**
 * Current academic year label for seed data. Used for idempotent upsert and `npm run seed:clear`.
 */
export const SEED_ACADEMIC_YEAR_NAME_EN = '2025-2026';

export const SEED_ACADEMIC_YEARS = [
  {
    schoolCode: 'GREENHS',
    name: {
      en: SEED_ACADEMIC_YEAR_NAME_EN,
      ar: '٢٠٢٥–٢٠٢٦',
    },
    startDate: '2025-09-01T00:00:00.000Z',
    endDate: '2026-06-30T23:59:59.999Z',
    isCurrent: true,
  },
  {
    schoolCode: 'BLUEVA',
    name: {
      en: SEED_ACADEMIC_YEAR_NAME_EN,
      ar: '٢٠٢٥–٢٠٢٦',
    },
    startDate: '2025-09-01T00:00:00.000Z',
    endDate: '2026-06-30T23:59:59.999Z',
    isCurrent: true,
  },
] as const;

/**
 * Homeroom teachers — one distinct teacher per seeded class (same teacher cannot be homeroom
 * for two classes in the same academic year).
 */
export const SEED_TEACHERS = [
  {
    schoolCode: 'GREENHS',
    email: 'teacher.ahmed@greenhs.test',
    name: { en: 'Ahmed Hassan', ar: 'أحمد حسن' },
    nationalId: 'SEED-NID-TEACHER-GREENHS-001',
  },
  {
    schoolCode: 'GREENHS',
    email: 'teacher.fatima@greenhs.test',
    name: { en: 'Fatima Al-Zahrani', ar: 'فاطمة الزهراني' },
    nationalId: 'SEED-NID-TEACHER-GREENHS-002',
  },
  {
    schoolCode: 'GREENHS',
    email: 'teacher.sami@greenhs.test',
    name: { en: 'Sami Al-Otaibi', ar: 'سامي العتيبي' },
    nationalId: 'SEED-NID-TEACHER-GREENHS-003',
  },
  /** Extra teacher (not a homeroom teacher in SEED_CLASSES). */
  {
    schoolCode: 'GREENHS',
    email: 'teacher.noor@greenhs.test',
    name: { en: 'Noor Al-Farsi', ar: 'نور الفارسي' },
    nationalId: 'SEED-NID-TEACHER-GREENHS-004',
  },
  {
    schoolCode: 'BLUEVA',
    email: 'teacher.nora@blueva.test',
    name: { en: 'Nora Al-Qahtani', ar: 'نورة القحطاني' },
    nationalId: 'SEED-NID-TEACHER-BLUEVA-001',
  },
  {
    schoolCode: 'BLUEVA',
    email: 'teacher.faisal@blueva.test',
    name: { en: 'Faisal Al-Dosari', ar: 'فيصل الدوسري' },
    nationalId: 'SEED-NID-TEACHER-BLUEVA-002',
  },
  {
    schoolCode: 'BLUEVA',
    email: 'teacher.huda@blueva.test',
    name: { en: 'Huda Al-Shammari', ar: 'هدى الشمري' },
    nationalId: 'SEED-NID-TEACHER-BLUEVA-003',
  },
] as const;

export const SEED_STUDENTS = [
  {
    schoolCode: 'GREENHS',
    email: 'student.one@greenhs.test',
    name: { en: 'Youssef Ali', ar: 'يوسف علي' },
    nationalId: 'SEED-NID-STU-GREENHS-001',
  },
  {
    schoolCode: 'GREENHS',
    email: 'student.two@greenhs.test',
    name: { en: 'Layla Mahmoud', ar: 'ليلى محمود' },
    nationalId: 'SEED-NID-STU-GREENHS-002',
  },
  {
    schoolCode: 'GREENHS',
    email: 'student.three@greenhs.test',
    name: { en: 'Omar Khaled', ar: 'عمر خالد' },
    nationalId: 'SEED-NID-STU-GREENHS-003',
  },
  {
    schoolCode: 'GREENHS',
    email: 'student.four@greenhs.test',
    name: { en: 'Nour Hafez', ar: 'نور حافظ' },
    nationalId: 'SEED-NID-STU-GREENHS-004',
  },
  /** No sample enrollment — use for POST /enrollments and placement checks. */
  {
    schoolCode: 'GREENHS',
    email: 'student.unenrolled@greenhs.test',
    name: { en: 'Tariq Omar', ar: 'طارق عمر' },
    nationalId: 'SEED-NID-STU-GREENHS-005',
  },
  {
    schoolCode: 'BLUEVA',
    email: 'student.one@blueva.test',
    name: { en: 'Khalid Saeed', ar: 'خالد سعيد' },
    nationalId: 'SEED-NID-STU-BLUEVA-001',
  },
  {
    schoolCode: 'BLUEVA',
    email: 'student.two@blueva.test',
    name: { en: 'Maha Al-Rashid', ar: 'مها الرشيد' },
    nationalId: 'SEED-NID-STU-BLUEVA-002',
  },
  /** No sample enrollment — use for manual enrollment tests. */
  {
    schoolCode: 'BLUEVA',
    email: 'student.unenrolled@blueva.test',
    name: { en: 'Sultan Fahad', ar: 'سلطان فهد' },
    nationalId: 'SEED-NID-STU-BLUEVA-003',
  },
  {
    schoolCode: 'BLUEVA',
    email: 'student.four@blueva.test',
    name: { en: 'Reem Abdullah', ar: 'ريم عبدالله' },
    nationalId: 'SEED-NID-STU-BLUEVA-004',
  },
] as const;

/**
 * Class sections inserted directly (same shape as API would create).
 * Grade is resolved via stage + order; academic year is the seed current year per school.
 */
export const SEED_CLASSES = [
  {
    schoolCode: 'GREENHS',
    stageName: 'Primary',
    gradeOrder: 3,
    sectionLetter: 'A',
    name: { en: 'Grade 3 A', ar: 'الصف 3 أ' },
    capacity: 35,
    homeroomTeacherNationalId: 'SEED-NID-TEACHER-GREENHS-001',
  },
  {
    schoolCode: 'GREENHS',
    stageName: 'Primary',
    gradeOrder: 3,
    sectionLetter: 'B',
    name: { en: 'Grade 3 B', ar: 'الصف 3 ب' },
    capacity: 32,
    homeroomTeacherNationalId: 'SEED-NID-TEACHER-GREENHS-002',
  },
  {
    schoolCode: 'GREENHS',
    stageName: 'Primary',
    gradeOrder: 4,
    sectionLetter: 'A',
    name: { en: 'Grade 4 A', ar: 'الصف 4 أ' },
    capacity: 30,
    homeroomTeacherNationalId: 'SEED-NID-TEACHER-GREENHS-003',
  },
  {
    schoolCode: 'BLUEVA',
    stageName: 'Primary',
    gradeOrder: 2,
    sectionLetter: 'A',
    name: { en: 'Grade 2 A', ar: 'الصف 2 أ' },
    capacity: 28,
    homeroomTeacherNationalId: 'SEED-NID-TEACHER-BLUEVA-001',
  },
  {
    schoolCode: 'BLUEVA',
    stageName: 'Primary',
    gradeOrder: 2,
    sectionLetter: 'B',
    name: { en: 'Grade 2 B', ar: 'الصف 2 ب' },
    capacity: 26,
    homeroomTeacherNationalId: 'SEED-NID-TEACHER-BLUEVA-002',
  },
  {
    schoolCode: 'BLUEVA',
    stageName: 'Primary',
    gradeOrder: 3,
    sectionLetter: 'A',
    name: { en: 'Grade 3 A', ar: 'الصف 3 أ' },
    capacity: 30,
    homeroomTeacherNationalId: 'SEED-NID-TEACHER-BLUEVA-003',
  },
] as const;

/**
 * Sample enrollments (one active enrollment per student here). Omitted students stay unenrolled
 * for manual API tests. Two students in GREENHS Grade 3 A exercises class student lists.
 */
export const SEED_SAMPLE_ENROLLMENTS = [
  {
    schoolCode: 'GREENHS',
    studentNationalId: 'SEED-NID-STU-GREENHS-001',
    stageName: 'Primary',
    gradeOrder: 3,
    sectionLetter: 'A',
  },
  {
    schoolCode: 'GREENHS',
    studentNationalId: 'SEED-NID-STU-GREENHS-004',
    stageName: 'Primary',
    gradeOrder: 3,
    sectionLetter: 'A',
  },
  {
    schoolCode: 'GREENHS',
    studentNationalId: 'SEED-NID-STU-GREENHS-002',
    stageName: 'Primary',
    gradeOrder: 3,
    sectionLetter: 'B',
  },
  {
    schoolCode: 'GREENHS',
    studentNationalId: 'SEED-NID-STU-GREENHS-003',
    stageName: 'Primary',
    gradeOrder: 4,
    sectionLetter: 'A',
  },
  {
    schoolCode: 'BLUEVA',
    studentNationalId: 'SEED-NID-STU-BLUEVA-001',
    stageName: 'Primary',
    gradeOrder: 2,
    sectionLetter: 'A',
  },
  {
    schoolCode: 'BLUEVA',
    studentNationalId: 'SEED-NID-STU-BLUEVA-002',
    stageName: 'Primary',
    gradeOrder: 2,
    sectionLetter: 'B',
  },
  {
    schoolCode: 'BLUEVA',
    studentNationalId: 'SEED-NID-STU-BLUEVA-004',
    stageName: 'Primary',
    gradeOrder: 3,
    sectionLetter: 'A',
  },
] as const;

/** All national IDs owned by seed users (for sessions + user cleanup). */
export function allSeedNationalIds(): string[] {
  const ids = new Set<string>();
  ids.add(SEED_SUPER_ADMIN.nationalId);
  for (const a of SEED_ADMINS) ids.add(a.nationalId);
  for (const t of SEED_TEACHERS) ids.add(t.nationalId);
  for (const s of SEED_STUDENTS) ids.add(s.nationalId);
  return [...ids];
}

/**
 * Subjects per school — codes are unique per school.
 * GREENHS uses credit hours (matches SEED_STRATEGIES CREDIT_HOURS).
 * BLUEVA uses total points (matches SEED_STRATEGIES); seed subjects set max_points only.
 */
export const SEED_SUBJECTS = [
  // ── Green Hills ──
  {
    schoolCode: 'GREENHS',
    code: 'MATH',
    name: { en: 'Mathematics', ar: 'الرياضيات' },
    category: 'core',
    description: {
      en: 'Algebra, geometry, statistics',
      ar: 'جبر وهندسة وإحصاء',
    },
    creditHours: 5,
    maxPoints: null,
    countsTowardGpa: true,
    order: 1,
  },
  {
    schoolCode: 'GREENHS',
    code: 'ARA',
    name: { en: 'Arabic Language', ar: 'اللغة العربية' },
    category: 'language',
    description: null,
    creditHours: 5,
    maxPoints: null,
    countsTowardGpa: true,
    order: 2,
  },
  {
    schoolCode: 'GREENHS',
    code: 'ENG',
    name: { en: 'English', ar: 'الإنجليزية' },
    category: 'language',
    description: null,
    creditHours: 4,
    maxPoints: null,
    countsTowardGpa: true,
    order: 3,
  },
  {
    schoolCode: 'GREENHS',
    code: 'SCI',
    name: { en: 'Science', ar: 'العلوم' },
    category: 'science',
    description: null,
    creditHours: 3,
    maxPoints: null,
    countsTowardGpa: true,
    order: 4,
  },
  {
    schoolCode: 'GREENHS',
    code: 'REL',
    name: { en: 'Islamic Studies', ar: 'التربية الإسلامية' },
    category: 'religious',
    description: null,
    creditHours: 2,
    maxPoints: null,
    countsTowardGpa: false,
    order: 5,
  },
  {
    schoolCode: 'GREENHS',
    code: 'PE',
    name: { en: 'Physical Education', ar: 'التربية الرياضية' },
    category: 'sports',
    description: null,
    creditHours: 2,
    maxPoints: null,
    countsTowardGpa: true,
    order: 6,
  },
  // ── Blue Valley ──
  {
    schoolCode: 'BLUEVA',
    code: 'MATH',
    name: { en: 'Mathematics', ar: 'الرياضيات' },
    category: 'core',
    description: null,
    creditHours: null,
    maxPoints: 100,
    countsTowardGpa: true,
    order: 1,
  },
  {
    schoolCode: 'BLUEVA',
    code: 'ARA',
    name: { en: 'Arabic', ar: 'العربية' },
    category: 'language',
    description: null,
    creditHours: null,
    maxPoints: 100,
    countsTowardGpa: true,
    order: 2,
  },
  {
    schoolCode: 'BLUEVA',
    code: 'ENG',
    name: { en: 'English', ar: 'الإنجليزية' },
    category: 'language',
    description: null,
    creditHours: null,
    maxPoints: 100,
    countsTowardGpa: true,
    order: 3,
  },
  {
    schoolCode: 'BLUEVA',
    code: 'SCI',
    name: { en: 'Science', ar: 'العلوم' },
    category: 'science',
    description: null,
    creditHours: null,
    maxPoints: 100,
    countsTowardGpa: true,
    order: 4,
  },
] as const;

/**
 * Curriculum: which grade level (by school + stage English name + order) offers which subject code.
 */
export const SEED_GRADE_LEVEL_SUBJECT_LINKS = [
  // Green Hills — Primary grade 3: core pack
  {
    schoolCode: 'GREENHS',
    stageName: 'Primary',
    gradeOrder: 3,
    subjectCode: 'MATH',
  },
  {
    schoolCode: 'GREENHS',
    stageName: 'Primary',
    gradeOrder: 3,
    subjectCode: 'ARA',
  },
  {
    schoolCode: 'GREENHS',
    stageName: 'Primary',
    gradeOrder: 3,
    subjectCode: 'ENG',
  },
  {
    schoolCode: 'GREENHS',
    stageName: 'Primary',
    gradeOrder: 3,
    subjectCode: 'SCI',
  },
  {
    schoolCode: 'GREENHS',
    stageName: 'Primary',
    gradeOrder: 3,
    subjectCode: 'REL',
  },
  {
    schoolCode: 'GREENHS',
    stageName: 'Primary',
    gradeOrder: 3,
    subjectCode: 'PE',
  },
  // Green Hills — Primary grade 4 (seed classes include Grade 4 A)
  {
    schoolCode: 'GREENHS',
    stageName: 'Primary',
    gradeOrder: 4,
    subjectCode: 'MATH',
  },
  {
    schoolCode: 'GREENHS',
    stageName: 'Primary',
    gradeOrder: 4,
    subjectCode: 'ARA',
  },
  {
    schoolCode: 'GREENHS',
    stageName: 'Primary',
    gradeOrder: 4,
    subjectCode: 'ENG',
  },
  {
    schoolCode: 'GREENHS',
    stageName: 'Primary',
    gradeOrder: 4,
    subjectCode: 'SCI',
  },
  {
    schoolCode: 'GREENHS',
    stageName: 'Primary',
    gradeOrder: 4,
    subjectCode: 'REL',
  },
  {
    schoolCode: 'GREENHS',
    stageName: 'Primary',
    gradeOrder: 4,
    subjectCode: 'PE',
  },
  // Green Hills — Primary grade 6: same subjects
  {
    schoolCode: 'GREENHS',
    stageName: 'Primary',
    gradeOrder: 6,
    subjectCode: 'MATH',
  },
  {
    schoolCode: 'GREENHS',
    stageName: 'Primary',
    gradeOrder: 6,
    subjectCode: 'ARA',
  },
  {
    schoolCode: 'GREENHS',
    stageName: 'Primary',
    gradeOrder: 6,
    subjectCode: 'ENG',
  },
  {
    schoolCode: 'GREENHS',
    stageName: 'Primary',
    gradeOrder: 6,
    subjectCode: 'SCI',
  },
  // Green Hills — Secondary grade 10 (first year secondary): no PE in seed
  {
    schoolCode: 'GREENHS',
    stageName: 'Secondary',
    gradeOrder: 1,
    subjectCode: 'MATH',
  },
  {
    schoolCode: 'GREENHS',
    stageName: 'Secondary',
    gradeOrder: 1,
    subjectCode: 'ARA',
  },
  {
    schoolCode: 'GREENHS',
    stageName: 'Secondary',
    gradeOrder: 1,
    subjectCode: 'ENG',
  },
  {
    schoolCode: 'GREENHS',
    stageName: 'Secondary',
    gradeOrder: 1,
    subjectCode: 'SCI',
  },
  {
    schoolCode: 'GREENHS',
    stageName: 'Secondary',
    gradeOrder: 1,
    subjectCode: 'REL',
  },
  // Green Hills — KG 1: light set
  {
    schoolCode: 'GREENHS',
    stageName: 'Kindergarten',
    gradeOrder: 1,
    subjectCode: 'ARA',
  },
  {
    schoolCode: 'GREENHS',
    stageName: 'Kindergarten',
    gradeOrder: 1,
    subjectCode: 'ENG',
  },
  {
    schoolCode: 'GREENHS',
    stageName: 'Kindergarten',
    gradeOrder: 1,
    subjectCode: 'PE',
  },
  // Blue Valley — Primary grade 1
  {
    schoolCode: 'BLUEVA',
    stageName: 'Primary',
    gradeOrder: 1,
    subjectCode: 'MATH',
  },
  {
    schoolCode: 'BLUEVA',
    stageName: 'Primary',
    gradeOrder: 1,
    subjectCode: 'ARA',
  },
  {
    schoolCode: 'BLUEVA',
    stageName: 'Primary',
    gradeOrder: 1,
    subjectCode: 'ENG',
  },
  {
    schoolCode: 'BLUEVA',
    stageName: 'Primary',
    gradeOrder: 2,
    subjectCode: 'MATH',
  },
  {
    schoolCode: 'BLUEVA',
    stageName: 'Primary',
    gradeOrder: 2,
    subjectCode: 'ARA',
  },
  {
    schoolCode: 'BLUEVA',
    stageName: 'Primary',
    gradeOrder: 2,
    subjectCode: 'SCI',
  },
  // Blue Valley — Primary grade 3 (seed classes include Grade 3 A)
  {
    schoolCode: 'BLUEVA',
    stageName: 'Primary',
    gradeOrder: 3,
    subjectCode: 'MATH',
  },
  {
    schoolCode: 'BLUEVA',
    stageName: 'Primary',
    gradeOrder: 3,
    subjectCode: 'ARA',
  },
  {
    schoolCode: 'BLUEVA',
    stageName: 'Primary',
    gradeOrder: 3,
    subjectCode: 'ENG',
  },
  {
    schoolCode: 'BLUEVA',
    stageName: 'Primary',
    gradeOrder: 3,
    subjectCode: 'SCI',
  },
] as const;

/**
 * Teacher can teach subject in school. `restrictToStageNameEn` matches `stages.name->>'en'` (e.g. Primary);
 * `restrictToStageNamesEn` (optional) lists multiple stages → stored as `allowed_stage_ids`;
 * omit both / empty → allowed in all stages (`allowed_stage_ids` NULL).
 * GREENHS rows use null where the same teacher must cover Kindergarten, Primary, and Secondary in seed curriculum.
 */
export type SeedTeacherSpecialization = {
  schoolCode: string;
  teacherNationalId: string;
  subjectCode: string;
  restrictToStageNameEn?: string | null;
  restrictToStageNamesEn?: readonly string[];
};

export const SEED_TEACHER_SPECIALIZATIONS: readonly SeedTeacherSpecialization[] = [
  {
    schoolCode: 'GREENHS',
    teacherNationalId: 'SEED-NID-TEACHER-GREENHS-001',
    subjectCode: 'MATH',
    restrictToStageNameEn: null,
  },
  {
    schoolCode: 'GREENHS',
    teacherNationalId: 'SEED-NID-TEACHER-GREENHS-001',
    subjectCode: 'ARA',
    restrictToStageNameEn: null,
  },
  {
    schoolCode: 'GREENHS',
    teacherNationalId: 'SEED-NID-TEACHER-GREENHS-002',
    subjectCode: 'ARA',
    restrictToStageNameEn: null,
  },
  {
    schoolCode: 'GREENHS',
    teacherNationalId: 'SEED-NID-TEACHER-GREENHS-002',
    subjectCode: 'ENG',
    restrictToStageNameEn: null,
  },
  {
    schoolCode: 'GREENHS',
    teacherNationalId: 'SEED-NID-TEACHER-GREENHS-003',
    subjectCode: 'SCI',
    restrictToStageNameEn: null,
  },
  {
    schoolCode: 'GREENHS',
    teacherNationalId: 'SEED-NID-TEACHER-GREENHS-003',
    subjectCode: 'MATH',
    restrictToStageNameEn: 'Primary',
  },
  {
    schoolCode: 'GREENHS',
    teacherNationalId: 'SEED-NID-TEACHER-GREENHS-004',
    subjectCode: 'REL',
    restrictToStageNameEn: null,
  },
  {
    schoolCode: 'GREENHS',
    teacherNationalId: 'SEED-NID-TEACHER-GREENHS-004',
    subjectCode: 'PE',
    restrictToStageNameEn: null,
  },
  {
    schoolCode: 'BLUEVA',
    teacherNationalId: 'SEED-NID-TEACHER-BLUEVA-001',
    subjectCode: 'MATH',
    restrictToStageNameEn: 'Primary',
  },
  {
    schoolCode: 'BLUEVA',
    teacherNationalId: 'SEED-NID-TEACHER-BLUEVA-001',
    subjectCode: 'ARA',
    restrictToStageNameEn: 'Primary',
  },
  {
    schoolCode: 'BLUEVA',
    teacherNationalId: 'SEED-NID-TEACHER-BLUEVA-002',
    subjectCode: 'ENG',
    restrictToStageNameEn: 'Primary',
  },
  {
    schoolCode: 'BLUEVA',
    teacherNationalId: 'SEED-NID-TEACHER-BLUEVA-003',
    subjectCode: 'MATH',
    restrictToStageNameEn: 'Primary',
  },
  {
    schoolCode: 'BLUEVA',
    teacherNationalId: 'SEED-NID-TEACHER-BLUEVA-003',
    subjectCode: 'SCI',
    restrictToStageNameEn: 'Primary',
  },
];

/**
 * Teaching assignments (class + subject + teacher). Class resolved like SEED_CLASSES / enrollments.
 */
/**
 * LMS courses are generated in `run-seed.ts` (not listed here): for each {@link SEED_CLASSES}
 * row, one course is inserted per subject in {@link SEED_GRADE_LEVEL_SUBJECT_LINKS} for that
 * class’s grade (same `schoolCode`, `stageName`, `gradeOrder`). This yields many rows for API
 * tests (`GET /courses/subjects/:subjectId`, publish, etc.) while respecting the unique
 * `(school_id, class_id, subject_id)` constraint.
 */
export const SEED_TEACHER_ASSIGNMENTS = [
  // GREENHS Grade 3 A — co-teach MATH
  {
    schoolCode: 'GREENHS',
    teacherNationalId: 'SEED-NID-TEACHER-GREENHS-001',
    subjectCode: 'MATH',
    stageName: 'Primary',
    gradeOrder: 3,
    sectionLetter: 'A',
  },
  {
    schoolCode: 'GREENHS',
    teacherNationalId: 'SEED-NID-TEACHER-GREENHS-003',
    subjectCode: 'MATH',
    stageName: 'Primary',
    gradeOrder: 3,
    sectionLetter: 'A',
  },
  {
    schoolCode: 'GREENHS',
    teacherNationalId: 'SEED-NID-TEACHER-GREENHS-001',
    subjectCode: 'ARA',
    stageName: 'Primary',
    gradeOrder: 3,
    sectionLetter: 'A',
  },
  {
    schoolCode: 'GREENHS',
    teacherNationalId: 'SEED-NID-TEACHER-GREENHS-002',
    subjectCode: 'ARA',
    stageName: 'Primary',
    gradeOrder: 3,
    sectionLetter: 'B',
  },
  {
    schoolCode: 'GREENHS',
    teacherNationalId: 'SEED-NID-TEACHER-GREENHS-003',
    subjectCode: 'SCI',
    stageName: 'Primary',
    gradeOrder: 4,
    sectionLetter: 'A',
  },
  {
    schoolCode: 'GREENHS',
    teacherNationalId: 'SEED-NID-TEACHER-GREENHS-003',
    subjectCode: 'MATH',
    stageName: 'Primary',
    gradeOrder: 4,
    sectionLetter: 'A',
  },
  {
    schoolCode: 'BLUEVA',
    teacherNationalId: 'SEED-NID-TEACHER-BLUEVA-001',
    subjectCode: 'MATH',
    stageName: 'Primary',
    gradeOrder: 2,
    sectionLetter: 'A',
  },
  {
    schoolCode: 'BLUEVA',
    teacherNationalId: 'SEED-NID-TEACHER-BLUEVA-001',
    subjectCode: 'ARA',
    stageName: 'Primary',
    gradeOrder: 2,
    sectionLetter: 'A',
  },
  {
    schoolCode: 'BLUEVA',
    teacherNationalId: 'SEED-NID-TEACHER-BLUEVA-002',
    subjectCode: 'ENG',
    stageName: 'Primary',
    gradeOrder: 2,
    sectionLetter: 'B',
  },
  {
    schoolCode: 'BLUEVA',
    teacherNationalId: 'SEED-NID-TEACHER-BLUEVA-003',
    subjectCode: 'MATH',
    stageName: 'Primary',
    gradeOrder: 3,
    sectionLetter: 'A',
  },
  {
    schoolCode: 'BLUEVA',
    teacherNationalId: 'SEED-NID-TEACHER-BLUEVA-003',
    subjectCode: 'SCI',
    stageName: 'Primary',
    gradeOrder: 3,
    sectionLetter: 'A',
  },
] as const;

/**
 * Default assessment profiles (components must sum to 100). Types: EXAM | QUIZ | ASSIGNMENT | ATTENDANCE | BEHAVIOR
 */
export const SEED_SUBJECT_ASSESSMENT_PROFILES = [
  {
    schoolCode: 'GREENHS',
    subjectCode: 'MATH',
    components: [
      { name: 'Midterm exam', weight: 30, type: 'EXAM' },
      { name: 'Final exam', weight: 40, type: 'EXAM' },
      { name: 'Homework', weight: 20, type: 'ASSIGNMENT' },
      { name: 'Participation', weight: 10, type: 'BEHAVIOR' },
    ],
  },
  {
    schoolCode: 'GREENHS',
    subjectCode: 'ARA',
    components: [
      { name: 'Written exams', weight: 50, type: 'EXAM' },
      { name: 'Oral / dictation', weight: 30, type: 'QUIZ' },
      { name: 'Homework', weight: 20, type: 'ASSIGNMENT' },
    ],
  },
  {
    schoolCode: 'GREENHS',
    subjectCode: 'SCI',
    components: [
      { name: 'Lab practical', weight: 25, type: 'EXAM' },
      { name: 'Theory exam', weight: 45, type: 'EXAM' },
      { name: 'Assignments', weight: 20, type: 'ASSIGNMENT' },
      { name: 'Attendance', weight: 10, type: 'ATTENDANCE' },
    ],
  },
  {
    schoolCode: 'BLUEVA',
    subjectCode: 'MATH',
    components: [
      { name: 'Continuous assessment', weight: 40, type: 'ASSIGNMENT' },
      { name: 'Midterm', weight: 25, type: 'EXAM' },
      { name: 'Final', weight: 35, type: 'EXAM' },
    ],
  },
] as const;
