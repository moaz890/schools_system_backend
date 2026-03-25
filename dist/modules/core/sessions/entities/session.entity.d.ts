import { BaseEntity } from '../../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
export declare class Session extends BaseEntity {
    userId: string;
    user: User;
    token: string;
    deviceInfo: string | null;
    ipAddress: string | null;
    expiresAt: Date;
    lastActive: Date | null;
}
