import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request: Request = context.switchToHttp().getRequest();
    const method = request.method;

    return next.handle().pipe(
      map((data) => {
        // If response already has our wrapper shape, pass through
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Paginated list response (has data array + meta)
        if (
          data &&
          typeof data === 'object' &&
          Array.isArray(data.data) &&
          data.meta
        ) {
          return {
            success: true,
            message: this.getDefaultMessage(method, true),
            data: data.data,
            meta: data.meta,
          };
        }

        // Single object response
        return {
          success: true,
          message: this.getDefaultMessage(method, false),
          data,
        };
      }),
    );
  }

  private getDefaultMessage(method: string, isList: boolean): string {
    const messages: Record<string, string> = {
      GET: isList
        ? 'Data retrieved successfully'
        : 'Record retrieved successfully',
      POST: 'Record created successfully',
      PATCH: 'Record updated successfully',
      PUT: 'Record updated successfully',
      DELETE: 'Record deleted successfully',
    };
    return messages[method] ?? 'Operation successful';
  }
}
