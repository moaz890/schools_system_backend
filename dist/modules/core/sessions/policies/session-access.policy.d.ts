import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import type { AuthCaller } from '../../users/types/auth-caller.type';
import { Session } from '../entities/session.entity';
import { AppLoggerService } from '../../logger/logger.service';
export declare class SessionAccessPolicy {
    private readonly usersRepository;
    private readonly logger;
    constructor(usersRepository: Repository<User>, logger: AppLoggerService);
    assertCanListSessions(caller: AuthCaller, targetUserId: string): Promise<void>;
    assertCanRevokeSession(caller: AuthCaller, session: Session): Promise<void>;
}
