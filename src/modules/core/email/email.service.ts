import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '../logger/logger.service';

const BREVO_API_FAILURE_HINT =
    'Brevo API rejected the request. Check BREVO_API_KEY and that MAIL_FROM uses a verified sender in Brevo. See docs/BREVO_SMTP_TROUBLESHOOTING.md (API section).';

@Injectable()
export class EmailService {
    constructor(
        private readonly configService: ConfigService,
        private readonly logger: AppLoggerService,
    ) {}

    /**
     * Sends password reset via Brevo transactional email API when `mail.enabled` is true.
     */
    async sendPasswordReset(params: {
        to: string;
        resetUrl: string;
        firstName: string;
        userId: string;
        schoolId: string | null;
    }): Promise<void> {
        const enabled = this.configService.get<boolean>('mail.enabled');
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

        const url = this.configService.get<string>('mail.brevoTransactionalEmailUrl');
        const apiKey = this.configService.get<string>('mail.brevoApiKey');
        const mailFrom = this.configService.get<string>('mail.from');
        const sender = parseSender(mailFrom ?? '');

        const payload = {
            sender: { name: sender.name, email: sender.email },
            to: [{ email: params.to, name: params.firstName }],
            subject,
            htmlContent: html,
            textContent: text,
        };

        try {
            const res = await fetch(url!, {
                method: 'POST',
                headers: {
                    accept: 'application/json',
                    'content-type': 'application/json',
                    'api-key': apiKey!,
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
                    throw new HttpException(
                        'Brevo API authentication failed (401). Check BREVO_API_KEY.',
                        HttpStatus.BAD_GATEWAY,
                    );
                }
                throw new HttpException(BREVO_API_FAILURE_HINT, HttpStatus.BAD_GATEWAY);
            }

            this.logger.log('EmailService', 'Password reset email sent (Brevo API)', {
                loggerId: 'EMAIL-RESET-002',
                userId: params.userId,
                schoolId: params.schoolId,
                to: params.to,
            });
        } catch (err: unknown) {
            if (err instanceof HttpException) {
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
}

/** Parses `MAIL_FROM`: `Name <email@domain.com>` or `email@domain.com`. */
function parseSender(mailFrom: string): { name: string; email: string } {
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

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
