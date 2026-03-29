import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthAuditLog } from '../entities/auth-audit-log.entity';
import { AppLoggerService } from '../../logger/logger.service';

export type AuthAuditEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'REFRESH_SUCCESS'
  | 'REFRESH_FAILURE'
  | 'REFRESH_TOKEN_REUSE_DETECTED'
  | 'LOGOUT_SUCCESS'
  | 'PASSWORD_CHANGE_SUCCESS'
  | 'RESET_PASSWORD_SUCCESS'
  | 'RESET_PASSWORD_FAILURE'
  | 'SESSIONS_REVOKED_ALL'
  | 'SESSION_REVOKED';

export type AuthAuditEventInput = {
  eventType: AuthAuditEventType;
  success: boolean;
  userId?: string | null;
  schoolId?: string | null;
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  message?: string | null;
  metadata?: Record<string, any> | null;
};

@Injectable()
export class AuthAuditLogService {
  constructor(
    @InjectRepository(AuthAuditLog)
    private readonly repo: Repository<AuthAuditLog>,
    private readonly logger: AppLoggerService,
  ) {}

  /**
   * Best-effort audit logging:
   * - never throw (auth flow should not break because audit insert failed)
   * - redact secrets: callers must avoid passing tokens/passwords
   */
  async record(input: AuthAuditEventInput): Promise<void> {
    try {
      await this.repo.insert({
        eventType: input.eventType,
        success: input.success,
        userId: input.userId ?? null,
        schoolId: input.schoolId ?? null,
        actorUserId: input.actorUserId ?? input.userId ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        message: input.message ?? null,
        metadata: (input.metadata ?? null) as any,
      });
    } catch (err: unknown) {
      this.logger.warn(
        'AuthAuditLogService',
        'Failed to persist auth audit log',
        {
          loggerId: 'AUDIT-AUTH-001',
          errorMessage: err instanceof Error ? err.message : String(err),
        },
      );
    }
  }
}
