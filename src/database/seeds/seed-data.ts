/**
 * Test fixtures: 2 schools, school_admins, and one platform super_admin.
 * School users: login with schoolCode. Super admin: email + password only (omit schoolCode).
 */
export const SEED_DEFAULT_PASSWORD = 'SchoolAdmin123!';

/** Platform — can create schools, list all schools, etc. Login: email + password only (omit schoolCode). */
export const SEED_SUPER_ADMIN = {
    email: 'carrots.moaz@gmail.com',
    firstName: 'Moaz',
    lastName: 'Seed',
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
        firstName: 'Sara',
        lastName: 'Al-Mutairi',
        nationalId: 'SEED-NID-ADMIN-GREENHS-001',
    },
    {
        schoolCode: 'GREENHS',
        email: 'deputy@greenhs.test',
        firstName: 'Khalid',
        lastName: 'Al-Fahad',
        nationalId: 'SEED-NID-ADMIN-GREENHS-002',
    },
    {
        schoolCode: 'BLUEVA',
        email: 'admin@blueva.test',
        firstName: 'Omar',
        lastName: 'Al-Harbi',
        nationalId: 'SEED-NID-ADMIN-BLUEVA-001',
    },
    {
        schoolCode: 'BLUEVA',
        email: 'deputy@blueva.test',
        firstName: 'Layla',
        lastName: 'Al-Zahrani',
        nationalId: 'SEED-NID-ADMIN-BLUEVA-002',
    },
] as const;
