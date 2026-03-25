import { Injectable } from '@nestjs/common';

export type LogLevel = 'log' | 'warn' | 'error' | 'debug';

export type LogMeta = {
    userId?: string | null;
    schoolId?: string | null;
    loggerId?: string;
    [key: string]: unknown;
};

@Injectable()
export class AppLoggerService {
    private readonly sensitiveKeys = new Set([
        'password',
        'confirmPassword',
        'token',
        'refreshToken',
        'refresh_token',
        'accessToken',
        'access_token',
        'authorization',
        'secret',
    ]);

    private sanitizeValue(value: unknown): unknown {
        if (Array.isArray(value)) {
            return value.map((v) => this.sanitizeValue(v));
        }

        if (value && typeof value === 'object') {
            const sanitized: Record<string, unknown> = {};
            for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
                if (this.sensitiveKeys.has(key)) {
                    sanitized[key] = '***REDACTED***';
                } else {
                    sanitized[key] = this.sanitizeValue(nested);
                }
            }
            return sanitized;
        }

        return value;
    }

    private format(
        level: LogLevel,
        context: string,
        message: string,
        meta?: LogMeta,
    ): string {
        return JSON.stringify({
            ts: new Date().toISOString(),
            level,
            context,
            message,
            ...(meta ? (this.sanitizeValue(meta) as LogMeta) : {}),
        });
    }

    log(context: string, message: string, meta?: LogMeta): void {
        // eslint-disable-next-line no-console
        console.log(this.format('log', context, message, meta));
    }

    warn(context: string, message: string, meta?: LogMeta): void {
        // eslint-disable-next-line no-console
        console.warn(this.format('warn', context, message, meta));
    }

    error(context: string, message: string, meta?: LogMeta): void {
        // eslint-disable-next-line no-console
        console.error(this.format('error', context, message, meta));
    }

    debug(context: string, message: string, meta?: LogMeta): void {
        if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.debug(this.format('debug', context, message, meta));
        }
    }
}
