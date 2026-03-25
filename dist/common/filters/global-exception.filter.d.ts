import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { AppLoggerService } from '../../modules/core/logger/logger.service';
export declare class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger;
    constructor(logger: AppLoggerService);
    catch(exception: unknown, host: ArgumentsHost): void;
}
