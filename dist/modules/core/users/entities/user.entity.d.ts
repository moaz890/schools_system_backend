import { BaseEntity } from '../../../../common/entities/base.entity';
import { UserRole } from '../../../../common/enums/user-role.enum';
import { AccountStatus } from '../../../../common/enums/account-status.enum';
import { School } from '../../schools/entities/school.entity';
import { Session } from '../../sessions/entities/session.entity';
export declare enum NationalIdType {
    NATIONAL_ID = "national_id",
    PASSPORT = "passport",
    IQAMA = "iqama"
}
export declare class User extends BaseEntity {
    schoolId: string | null;
    school?: School | null;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    role: UserRole;
    status: AccountStatus;
    avatarUrl: string | null;
    nationalId: string;
    nationalIdType: NationalIdType;
    failedLoginAttempts: number;
    lockedUntil: Date | null;
    credentialVersion: number;
    passwordResetTokenHash: string | null;
    passwordResetExpiresAt: Date | null;
    sessions: Session[];
}
