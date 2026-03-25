"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppLoggerService = void 0;
const common_1 = require("@nestjs/common");
let AppLoggerService = class AppLoggerService {
    sensitiveKeys = new Set([
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
    sanitizeValue(value) {
        if (Array.isArray(value)) {
            return value.map((v) => this.sanitizeValue(v));
        }
        if (value && typeof value === 'object') {
            const sanitized = {};
            for (const [key, nested] of Object.entries(value)) {
                if (this.sensitiveKeys.has(key)) {
                    sanitized[key] = '***REDACTED***';
                }
                else {
                    sanitized[key] = this.sanitizeValue(nested);
                }
            }
            return sanitized;
        }
        return value;
    }
    format(level, context, message, meta) {
        return JSON.stringify({
            ts: new Date().toISOString(),
            level,
            context,
            message,
            ...(meta ? this.sanitizeValue(meta) : {}),
        });
    }
    log(context, message, meta) {
        console.log(this.format('log', context, message, meta));
    }
    warn(context, message, meta) {
        console.warn(this.format('warn', context, message, meta));
    }
    error(context, message, meta) {
        console.error(this.format('error', context, message, meta));
    }
    debug(context, message, meta) {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(this.format('debug', context, message, meta));
        }
    }
};
exports.AppLoggerService = AppLoggerService;
exports.AppLoggerService = AppLoggerService = __decorate([
    (0, common_1.Injectable)()
], AppLoggerService);
//# sourceMappingURL=logger.service.js.map