import { UserRole } from '../../../../common/enums/user-role.enum';
export type AuthCaller = {
    id: string;
    role: UserRole;
    schoolId: string | null;
};
