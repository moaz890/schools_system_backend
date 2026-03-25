import { UserRole } from '../../../../common/enums/user-role.enum';

/** Shape of `request.user` after JWT validation */
export type AuthCaller = {
    id: string;
    role: UserRole;
    schoolId: string | null;
};
