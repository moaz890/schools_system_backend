import { Injectable } from '@nestjs/common';
import { AuthAuditLogService } from './auth-audit-log.service';
import type {
    AuthClientContext,
    AuthSubjectScope,
    LoginAuditMetadata,
    RefreshFailureActorContext,
    ResetPasswordAuditFailureInput,
    SessionRevokeAuditInput,
} from '../../auth/types';

/**
 * Typed facade over {@link AuthAuditLogService} for auth/password/session security events.
 * Callers pass structured params instead of building raw audit payloads.
 */
@Injectable()
export class AuthSecurityAuditService {
    constructor(private readonly auditLog: AuthAuditLogService) {}

    async recordLoginSuccess(
        userId: string,
        schoolId: string | null,
        client: AuthClientContext,
    ): Promise<void> {
        await this.auditLog.record({
            eventType: 'LOGIN_SUCCESS',
            success: true,
            userId,
            schoolId,
            actorUserId: userId,
            ipAddress: client.ipAddress ?? null,
            userAgent: client.deviceInfo ?? null,
            message: 'Login succeeded',
        });
    }

    async recordLoginFailure(
        message: string,
        subject: AuthSubjectScope,
        client: AuthClientContext,
        metadata?: LoginAuditMetadata | null,
    ): Promise<void> {
        await this.auditLog.record({
            eventType: 'LOGIN_FAILURE',
            success: false,
            userId: subject.userId,
            schoolId: subject.schoolId,
            actorUserId: subject.userId,
            ipAddress: client.ipAddress ?? null,
            userAgent: client.deviceInfo ?? null,
            message,
            metadata: metadata ? { ...metadata } : null,
        });
    }

    async recordRefreshSuccess(
        userId: string,
        schoolId: string | null,
        client: AuthClientContext,
    ): Promise<void> {
        await this.auditLog.record({
            eventType: 'REFRESH_SUCCESS',
            success: true,
            userId,
            actorUserId: userId,
            schoolId,
            ipAddress: client.ipAddress ?? null,
            userAgent: client.deviceInfo ?? null,
        });
    }

    async recordRefreshFailure(
        message: string,
        actor: RefreshFailureActorContext,
        client: AuthClientContext,
    ): Promise<void> {
        await this.auditLog.record({
            eventType: 'REFRESH_FAILURE',
            success: false,
            userId: actor.actorUserId,
            actorUserId: actor.actorUserId,
            schoolId: actor.schoolId,
            ipAddress: client.ipAddress ?? null,
            userAgent: client.deviceInfo ?? null,
            message,
        });
    }

    /**
     * Refresh token matched the session's *previous* hash after rotation — likely theft or parallel use.
     * All refresh sessions for the user are revoked before this is called.
     */
    async recordRefreshTokenReuseDetected(
        userId: string,
        schoolId: string | null,
        client: AuthClientContext,
        metadata?: { sessionId?: string } | null,
    ): Promise<void> {
        await this.auditLog.record({
            eventType: 'REFRESH_TOKEN_REUSE_DETECTED',
            success: false,
            userId,
            actorUserId: userId,
            schoolId,
            ipAddress: client.ipAddress ?? null,
            userAgent: client.deviceInfo ?? null,
            message:
                'Rotated refresh token replayed; all refresh-token sessions revoked',
            metadata: metadata ?? null,
        });
        await this.recordSessionsRevokedAll(
            userId,
            schoolId,
            'All sessions revoked after refresh token reuse detection',
            client,
        );
    }

    async recordLogoutSuccess(
        userId: string,
        client: AuthClientContext,
    ): Promise<void> {
        await this.auditLog.record({
            eventType: 'LOGOUT_SUCCESS',
            success: true,
            userId,
            actorUserId: userId,
            ipAddress: client.ipAddress ?? null,
            userAgent: client.deviceInfo ?? null,
        });
    }

    async recordPasswordChangeSuccess(
        userId: string,
        schoolId: string | null,
        credentialVersion: number,
        client: AuthClientContext,
    ): Promise<void> {
        await this.auditLog.record({
            eventType: 'PASSWORD_CHANGE_SUCCESS',
            success: true,
            userId,
            actorUserId: userId,
            schoolId,
            ipAddress: client.ipAddress ?? null,
            userAgent: client.deviceInfo ?? null,
            message: 'Password changed (all sessions revoked)',
            metadata: { credentialVersion },
        });
        await this.recordSessionsRevokedAll(
            userId,
            schoolId,
            'All refresh-token sessions revoked',
            client,
        );
    }

    async recordSessionsRevokedAll(
        userId: string,
        schoolId: string | null,
        message: string,
        client: AuthClientContext,
    ): Promise<void> {
        await this.auditLog.record({
            eventType: 'SESSIONS_REVOKED_ALL',
            success: true,
            userId,
            actorUserId: userId,
            schoolId,
            ipAddress: client.ipAddress ?? null,
            userAgent: client.deviceInfo ?? null,
            message,
        });
    }

    async recordResetPasswordSuccess(
        userId: string,
        schoolId: string | null,
        client: AuthClientContext,
    ): Promise<void> {
        await this.auditLog.record({
            eventType: 'RESET_PASSWORD_SUCCESS',
            success: true,
            userId,
            actorUserId: userId,
            schoolId,
            ipAddress: client.ipAddress ?? null,
            userAgent: client.deviceInfo ?? null,
            message: 'Password reset successful (all sessions revoked)',
        });
        await this.recordSessionsRevokedAll(
            userId,
            schoolId,
            'All refresh-token sessions revoked after password reset',
            client,
        );
    }

    async recordResetPasswordFailure(
        input: ResetPasswordAuditFailureInput,
    ): Promise<void> {
        await this.auditLog.record({
            eventType: 'RESET_PASSWORD_FAILURE',
            success: false,
            userId: input.userId,
            actorUserId: null,
            schoolId: input.schoolId,
            ipAddress: input.client.ipAddress ?? null,
            userAgent: input.client.deviceInfo ?? null,
            message: input.message,
        });
    }

    async recordSessionRevoked(input: SessionRevokeAuditInput): Promise<void> {
        await this.auditLog.record({
            eventType: 'SESSION_REVOKED',
            success: true,
            userId: input.sessionUserId,
            schoolId: input.schoolId,
            actorUserId: input.actorUserId,
            ipAddress: input.ipAddress ?? null,
            userAgent: input.userAgent ?? null,
            message: 'Refresh-token session revoked',
        });
    }
}
