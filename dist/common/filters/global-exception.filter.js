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
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../modules/core/logger/logger.service");
let GlobalExceptionFilter = class GlobalExceptionFilter {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let errors = null;
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                const res = exceptionResponse;
                if (Array.isArray(res.message)) {
                    message = 'Validation failed';
                    errors = res.message.map((msg) => ({ message: msg }));
                }
                else {
                    message = res.message ?? exception.message;
                }
            }
            else {
                message = exceptionResponse;
            }
        }
        else if (exception instanceof Error) {
            message = exception.message;
            this.logger.error('GlobalExceptionFilter', 'Unhandled exception', {
                loggerId: 'GLOBAL-ERR-001',
                message: exception.message,
                stack: exception.stack,
                path: request.url,
                method: request.method,
                userId: request.user?.id ?? null,
                schoolId: request.user?.schoolId ?? null,
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
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = __decorate([
    (0, common_1.Catch)(),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_service_1.AppLoggerService])
], GlobalExceptionFilter);
//# sourceMappingURL=global-exception.filter.js.map