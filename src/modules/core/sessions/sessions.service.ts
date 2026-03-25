import {
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Session } from './entities/session.entity';
import { User } from '../users/entities/user.entity';
import { SessionAccessPolicy } from './policies/session-access.policy';
import type { AuthCaller } from '../users/types/auth-caller.type';
import { MAX_SESSIONS_PER_USER } from './constants';
import { AppLoggerService } from '../logger/logger.service';

export type SessionListItem = Pick<
    Session,
    | 'id'
    | 'deviceInfo'
    | 'ipAddress'
    | 'expiresAt'
    | 'lastActive'
    | 'createdAt'
>;

/**
 * Refresh-token session lifecycle: create, list, revoke, and auth integration.
 */
@Injectable()
export class SessionsService {
    constructor(
        @InjectRepository(Session)
        private readonly sessionsRepository: Repository<Session>,
        private readonly sessionAccessPolicy: SessionAccessPolicy,
        private readonly logger: AppLoggerService,
    ) {}

    // ─── HTTP API (multi-device tracking) ───────────────────────────────────

    async listSessionsForUser(
        targetUserId: string,
        caller: AuthCaller,
    ): Promise<SessionListItem[]> {
        await this.sessionAccessPolicy.assertCanListSessions(caller, targetUserId);

        return this.sessionsRepository.find({
            where: { userId: targetUserId } as any,
            order: { lastActive: 'DESC', createdAt: 'DESC' } as any,
            select: [
                'id',
                'deviceInfo',
                'ipAddress',
                'expiresAt',
                'lastActive',
                'createdAt',
            ] as any,
        }) as Promise<SessionListItem[]>;
    }

    async revokeSession(sessionId: string, caller: AuthCaller): Promise<void> {
        const session = await this.sessionsRepository.findOne({
            where: { id: sessionId } as any,
        });
        if (!session) {
            throw new NotFoundException('Session not found');
        }

        await this.sessionAccessPolicy.assertCanRevokeSession(caller, session);
        await this.sessionsRepository.remove(session);
        this.logger.log('SessionsService', 'Session revoked', {
            loggerId: 'SESSION-REVOKE-001',
            userId: session.userId,
            sessionId,
            actorUserId: caller.id,
            actorSchoolId: caller.schoolId,
        });
    }

    // ─── Auth module integration (login / refresh / logout / password) ─────

    async countByUserId(userId: string): Promise<number> {
        return this.sessionsRepository.count({ where: { userId } as any });
    }

    async removeOldestSession(userId: string): Promise<void> {
        const oldest = await this.sessionsRepository.findOne({
            where: { userId } as any,
            order: { createdAt: 'ASC' } as any,
        });
        if (oldest) {
            await this.sessionsRepository.remove(oldest);
        }
    }

    async createRefreshSession(input: {
        userId: string;
        hashedRefreshToken: string;
        deviceInfo: string | null;
        ipAddress: string | null;
        expiresAt: Date;
    }): Promise<void> {
        const session = this.sessionsRepository.create({
            userId: input.userId,
            token: input.hashedRefreshToken,
            deviceInfo: input.deviceInfo,
            ipAddress: input.ipAddress,
            expiresAt: input.expiresAt,
            lastActive: new Date(),
        } as any);
        await this.sessionsRepository.save(session);
    }

    /**
     * Enforces max sessions, then persists a new refresh session.
     */
    async enforceLimitAndCreateSession(input: {
        user: User;
        plainRefreshToken: string;
        deviceInfo?: string;
        ipAddress?: string;
    }): Promise<void> {
        const count = await this.countByUserId((input.user as any).id);
        if (count >= MAX_SESSIONS_PER_USER) {
            this.logger.warn('SessionsService', 'Max sessions reached, removing oldest', {
                loggerId: 'SESSION-LIMIT-001',
                userId: (input.user as any).id,
                max: MAX_SESSIONS_PER_USER,
            });
            await this.removeOldestSession((input.user as any).id);
        }

        const hashedRefreshToken = await bcrypt.hash(input.plainRefreshToken, 10);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await this.createRefreshSession({
            userId: (input.user as any).id,
            hashedRefreshToken,
            deviceInfo: input.deviceInfo ?? null,
            ipAddress: input.ipAddress ?? null,
            expiresAt,
        });
    }

    async findSessionsByUserId(userId: string): Promise<Session[]> {
        return this.sessionsRepository.find({ where: { userId } as any });
    }

    async findMatchingRefreshSession(
        userId: string,
        plainRefreshToken: string,
    ): Promise<Session | null> {
        const sessions = await this.findSessionsByUserId(userId);
        for (const session of sessions) {
            const matches = await bcrypt.compare(plainRefreshToken, session.token);
            if (matches) {
                return session;
            }
        }
        return null;
    }

    assertRefreshSessionValid(
        session: Session | null,
    ): asserts session is Session {
        if (!session || session.expiresAt < new Date()) {
            throw new UnauthorizedException('Session expired or revoked');
        }
    }

    async rotateRefreshToken(
        sessionId: string,
        newPlainRefreshToken: string,
    ): Promise<void> {
        const hashedNew = await bcrypt.hash(newPlainRefreshToken, 10);
        await this.sessionsRepository.update(
            { id: sessionId } as any,
            { token: hashedNew, lastActive: new Date() } as any,
        );
    }

    async removeByRefreshToken(
        userId: string,
        plainRefreshToken: string,
    ): Promise<void> {
        const sessions = await this.findSessionsByUserId(userId);
        for (const session of sessions) {
            const matches = await bcrypt.compare(plainRefreshToken, session.token);
            if (matches) {
                await this.sessionsRepository.remove(session);
                return;
            }
        }
    }

    async deleteAllForUser(userId: string): Promise<void> {
        await this.sessionsRepository.delete({ userId } as any);
    }
}
