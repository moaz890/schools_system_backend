import { BaseEntity } from '../../../../common/entities/base.entity';
export interface SchoolSettings {
    gradingScale: 'letter' | 'percentage' | 'gpa';
    allowLateSubmissions: boolean;
    maxLoginAttempts: number;
    lockoutDurationMinutes: number;
    academicYearStartMonth: number;
}
export declare class School extends BaseEntity {
    name: string;
    code: string;
    email: string;
    phone: string;
    address: string;
    logoUrl: string;
    primaryColor: string | null;
    isActive: boolean;
    settings: SchoolSettings;
}
