import { Repository } from 'typeorm';
import { Session } from './entities/session.entity';
import { User } from '../users/entities/user.entity';
import { SessionAccessPolicy } from './policies/session-access.policy';
import type { AuthCaller } from '../users/types/auth-caller.type';
import { AppLoggerService } from '../logger/logger.service';
export type SessionListItem = Pick<Session, 'id' | 'deviceInfo' | 'ipAddress' | 'expiresAt' | 'lastActive' | 'createdAt'>;
export declare class SessionsService {
    private readonly sessionsRepository;
    private readonly sessionAccessPolicy;
    private readonly logger;
    constructor(sessionsRepository: Repository<Session>, sessionAccessPolicy: SessionAccessPolicy, logger: AppLoggerService);
    listSessionsForUser(targetUserId: string, caller: AuthCaller): Promise<SessionListItem[]>;
    revokeSession(sessionId: string, caller: AuthCaller): Promise<void>;
    countByUserId(userId: string): Promise<number>;
    removeOldestSession(userId: string): Promise<void>;
    createRefreshSession(input: {
        userId: string;
        hashedRefreshToken: string;
        deviceInfo: string | null;
        ipAddress: string | null;
        expiresAt: Date;
    }): Promise<void>;
    enforceLimitAndCreateSession(input: {
        user: User;
        plainRefreshToken: string;
        deviceInfo?: string;
        ipAddress?: string;
    }): Promise<void>;
    findSessionsByUserId(userId: string): Promise<Session[]>;
    findMatchingRefreshSession(userId: string, plainRefreshToken: string): Promise<Session | null>;
    assertRefreshSessionValid(session: Session | null): asserts session is Session;
    rotateRefreshToken(sessionId: string, newPlainRefreshToken: string): Promise<void>;
    removeByRefreshToken(userId: string, plainRefreshToken: string): Promise<void>;
    deleteAllForUser(userId: string): Promise<void>;
}
