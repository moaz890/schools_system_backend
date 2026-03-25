"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpLoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const crypto_1 = require("crypto");
const logger_service_1 = require("../../modules/core/logger/logger.service");
let HttpLoggingInterceptor = class HttpLoggingInterceptor {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    intercept(context, next) {
        if (context.getType() !== 'http') {
            return next.handle();
        }
        const req = context.switchToHttp().getRequest();
        const res = context.switchToHttp().getResponse();
        const startedAt = Date.now();
        const requestId = req.headers['x-request-id']?.toString() || (0, crypto_1.randomUUID)();
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
        return next.handle().pipe((0, operators_1.tap)((payload) => {
            const durationMs = Date.now() - startedAt;
            let responseSize = null;
            try {
                responseSize = JSON.stringify(payload).length;
            }
            catch {
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
        }), (0, operators_1.catchError)((error) => {
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
            return (0, rxjs_1.throwError)(() => error);
        }));
    }
};
exports.HttpLoggingInterceptor = HttpLoggingInterceptor;
exports.HttpLoggingInterceptor = HttpLoggingInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_service_1.AppLoggerService])
], HttpLoggingInterceptor);
//# sourceMappingURL=http-logging.interceptor.js.map