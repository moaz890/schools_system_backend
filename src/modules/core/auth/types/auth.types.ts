/**
 * Shared auth-domain types for audit recording + request context.
 *
 * Kept in one file to avoid scattering “parameter bundle” interfaces across many files.
 */
export interface AuthClientContext {
    deviceInfo?: string;
    ipAddress?: string;
}

export interface AuthSubjectScope {
    userId: string | null;
    schoolId: string | null;
}

export interface LoginAuditMetadata {
    email: string;
    schoolCode?: string | null;
}

export interface RefreshFailureActorContext {
    actorUserId: string | null;
    schoolId: string | null;
}

/**
 * Input for recording a failed password-reset attempt (audit only).
 */
export interface ResetPasswordAuditFailureInput {
    userId: string;
    schoolId: string | null;
    message: string;
    client: AuthClientContext;
}

/**
 * Audit row for a single session revocation (admin/self-service revoke).
 */
export interface SessionRevokeAuditInput {
    sessionUserId: string;
    schoolId: string | null;
    actorUserId: string;
    ipAddress?: string | null;
    userAgent?: string | null;
}

/** Normalizes optional request fields into a single object for services/audit. */
export function toAuthClientContext(
    deviceInfo?: string,
    ipAddress?: string,
): AuthClientContext {
    return { deviceInfo, ipAddress };
}

