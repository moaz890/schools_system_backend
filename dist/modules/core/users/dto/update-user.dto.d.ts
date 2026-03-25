import { AccountStatus } from '../../../../common/enums/account-status.enum';
export declare class UpdateUserDto {
    firstName?: string;
    lastName?: string;
    phone?: string;
    status?: AccountStatus;
    nationalId?: string;
    nationalIdType?: string;
    avatarUrl?: string;
    passwordHash?: string;
    email?: string;
    role?: string;
}
