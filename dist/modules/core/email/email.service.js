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
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const logger_service_1 = require("../logger/logger.service");
const BREVO_API_FAILURE_HINT = 'Brevo API rejected the request. Check BREVO_API_KEY and that MAIL_FROM uses a verified sender in Brevo. See docs/BREVO_SMTP_TROUBLESHOOTING.md (API section).';
let EmailService = class EmailService {
    configService;
    logger;
    constructor(configService, logger) {
        this.configService = configService;
        this.logger = logger;
    }
    async sendPasswordReset(params) {
        const enabled = this.configService.get('mail.enabled');
        const subject = 'Reset your password';
        const text = [
            `Hello ${params.firstName},`,
            '',
            `Reset your password using this link (valid for a limited time):`,
            params.resetUrl,
            '',
            'If you did not request a password reset, you can ignore this email.',
        ].join('\n');
        const safeName = escapeHtml(params.firstName);
        const html = `
<p>Hello ${safeName},</p>
<p><a href="${escapeHtml(params.resetUrl)}">Reset your password</a></p>
<p>If you did not request a password reset, you can ignore this email.</p>
`.trim();
        if (!enabled) {
            this.logger.warn('EmailService', 'Mail is not configured: password reset email was not sent', {
                loggerId: 'EMAIL-RESET-001',
                userId: params.userId,
                schoolId: params.schoolId,
                to: params.to,
            });
            return;
        }
        const url = this.configService.get('mail.brevoTransactionalEmailUrl');
        const apiKey = this.configService.get('mail.brevoApiKey');
        const mailFrom = this.configService.get('mail.from');
        const sender = parseSender(mailFrom ?? '');
        const payload = {
            sender: { name: sender.name, email: sender.email },
            to: [{ email: params.to, name: params.firstName }],
            subject,
            htmlContent: html,
            textContent: text,
        };
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    accept: 'application/json',
                    'content-type': 'application/json',
                    'api-key': apiKey,
                },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const bodyText = await res.text();
                this.logger.error('EmailService', 'Brevo API returned error', {
                    loggerId: 'EMAIL-RESET-003',
                    userId: params.userId,
                    schoolId: params.schoolId,
                    to: params.to,
                    httpStatus: res.status,
                    bodySnippet: bodyText.slice(0, 500),
                });
                if (res.status === 401) {
                    throw new common_1.HttpException('Brevo API authentication failed (401). Check BREVO_API_KEY.', common_1.HttpStatus.BAD_GATEWAY);
                }
                throw new common_1.HttpException(BREVO_API_FAILURE_HINT, common_1.HttpStatus.BAD_GATEWAY);
            }
            this.logger.log('EmailService', 'Password reset email sent (Brevo API)', {
                loggerId: 'EMAIL-RESET-002',
                userId: params.userId,
                schoolId: params.schoolId,
                to: params.to,
            });
        }
        catch (err) {
            if (err instanceof common_1.HttpException) {
                throw err;
            }
            const message = err instanceof Error ? err.message : 'Unknown error';
            this.logger.error('EmailService', 'Failed to send password reset email', {
                loggerId: 'EMAIL-RESET-004',
                userId: params.userId,
                schoolId: params.schoolId,
                to: params.to,
                errorMessage: message,
            });
            throw err;
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        logger_service_1.AppLoggerService])
], EmailService);
function parseSender(mailFrom) {
    const s = mailFrom.trim();
    const angle = s.match(/^(.+?)\s*<([^>]+)>$/);
    if (angle) {
        const rawName = angle[1].replace(/^["']|["']$/g, '').trim();
        return {
            name: rawName || 'Schools Platform',
            email: angle[2].trim(),
        };
    }
    return { name: 'Schools Platform', email: s };
}
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
//# sourceMappingURL=email.service.js.map