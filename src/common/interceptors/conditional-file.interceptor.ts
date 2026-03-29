import { Injectable, mixin, NestInterceptor } from '@nestjs/common';
import multer from 'multer';
import { transformException } from '@nestjs/platform-express/multer/multer/multer.utils';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { from, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

/**
 * Runs multer only when request is `multipart/*`.
 * This lets `create`/`update` stay compatible with regular JSON requests.
 */
export function ConditionalFileInterceptor(
  fieldName: string,
  localOptions: multer.Options,
): any {
  const multipartMulter = multer(localOptions);

  @Injectable()
  class ConditionalMixinInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const ctx = context.switchToHttp();
      const request = ctx.getRequest();
      const response = ctx.getResponse();

      const contentType = request?.headers?.['content-type'];
      const isMultipart =
        typeof contentType === 'string' &&
        contentType.toLowerCase().includes('multipart/');

      if (!isMultipart) {
        return next.handle();
      }

      return from(
        new Promise<void>((resolve, reject) => {
          multipartMulter.single(fieldName)(request, response, (err: any) => {
            if (err) return reject(transformException(err));
            resolve();
          });
        }),
      ).pipe(switchMap(() => next.handle()));
    }
  }

  return mixin(ConditionalMixinInterceptor);
}
