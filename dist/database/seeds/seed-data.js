"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEED_ADMINS = exports.SEED_SCHOOLS = exports.SEED_SUPER_ADMIN = exports.SEED_DEFAULT_PASSWORD = void 0;
exports.SEED_DEFAULT_PASSWORD = 'SchoolAdmin123!';
exports.SEED_SUPER_ADMIN = {
    email: 'carrots.moaz@gmail.com',
    firstName: 'Moaz',
    lastName: 'Seed',
    nationalId: 'SEED-NID-SUPERADMIN-CARROTS-001',
};
exports.SEED_SCHOOLS = [
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
];
exports.SEED_ADMINS = [
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
];
//# sourceMappingURL=seed-data.js.map