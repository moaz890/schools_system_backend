import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLoggerService } from '../../modules/core/logger/logger.service';

@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any[] | null = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as any;
        // class-validator generates { message: string[] } on 400
        if (Array.isArray(res.message)) {
          message = 'Validation failed';
          errors = res.message.map((msg: string) => ({ message: msg }));
        } else {
          message = res.message ?? exception.message;
        }
      } else {
        message = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error('GlobalExceptionFilter', 'Unhandled exception', {
        loggerId: 'GLOBAL-ERR-001',
        message: exception.message,
        stack: exception.stack,
        path: request.url,
        method: request.method,
        userId: (request as any).user?.id ?? null,
        schoolId: (request as any).user?.schoolId ?? null,
      });
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      ...(errors ? { errors } : {}),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
