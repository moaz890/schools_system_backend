import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AppLoggerService } from '../../modules/core/logger/logger.service';
export declare class HttpLoggingInterceptor implements NestInterceptor {
    private readonly logger;
    constructor(logger: AppLoggerService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
}
