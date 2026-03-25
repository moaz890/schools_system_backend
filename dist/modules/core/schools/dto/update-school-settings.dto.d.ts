export declare class UpdateSchoolSettingsDto {
    gradingScale?: 'letter' | 'percentage' | 'gpa';
    allowLateSubmissions?: boolean;
    maxLoginAttempts?: number;
    lockoutDurationMinutes?: number;
    academicYearStartMonth?: number;
}
