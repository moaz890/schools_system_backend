import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { AppLoggerService } from '../../modules/core/logger/logger.service';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
    constructor(private readonly logger: AppLoggerService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        if (context.getType() !== 'http') {
            return next.handle();
        }

        const req = context.switchToHttp().getRequest<Request & { requestId?: string; user?: any }>();
        const res = context.switchToHttp().getResponse<Response>();
        const startedAt = Date.now();

        const requestId = req.headers['x-request-id']?.toString() || randomUUID();
        req.requestId = requestId;
        res.setHeader('x-request-id', requestId);

        this.logger.debug('HttpLoggingInterceptor', 'Incoming request', {
            loggerId: 'HTTP-REQ-001',
            requestId,
            method: req.method,
            path: req.originalUrl ?? req.url,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            userId: req.user?.id ?? null,
            schoolId: req.user?.schoolId ?? null,
            query: req.query,
            params: req.params,
            body: req.body,
        });

        return next.handle().pipe(
            tap((payload) => {
                const durationMs = Date.now() - startedAt;
                let responseSize: number | null = null;
                try {
                    responseSize = JSON.stringify(payload).length;
                } catch {
                    responseSize = null;
                }

                this.logger.log('HttpLoggingInterceptor', 'Outgoing response', {
                    loggerId: 'HTTP-RES-001',
                    requestId,
                    method: req.method,
                    path: req.originalUrl ?? req.url,
                    statusCode: res.statusCode,
                    durationMs,
                    responseSize,
                    userId: req.user?.id ?? null,
                    schoolId: req.user?.schoolId ?? null,
                });
            }),
            catchError((error) => {
                const durationMs = Date.now() - startedAt;
                this.logger.error('HttpLoggingInterceptor', 'Request failed', {
                    loggerId: 'HTTP-ERR-001',
                    requestId,
                    method: req.method,
                    path: req.originalUrl ?? req.url,
                    durationMs,
                    statusCode: error?.status ?? 500,
                    errorMessage: error?.message ?? 'Unhandled error',
                    userId: req.user?.id ?? null,
                    schoolId: req.user?.schoolId ?? null,
                });
                return throwError(() => error);
            }),
        );
    }
}
