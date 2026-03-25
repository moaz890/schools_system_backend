"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('mail', () => {
    const apiKey = (process.env.BREVO_API_KEY ?? '').trim();
    const from = (process.env.MAIL_FROM ?? '').trim();
    const explicitOff = process.env.MAIL_ENABLED === 'false';
    const enabled = !explicitOff && Boolean(apiKey && from);
    const apiBase = process.env.BREVO_API_BASE_URL?.replace(/\/$/, '') ?? 'https://api.brevo.com/v3';
    return {
        enabled,
        brevoApiKey: apiKey,
        brevoTransactionalEmailUrl: `${apiBase}/smtp/email`,
        from,
        frontendPasswordResetBaseUrl: process.env.FRONTEND_PASSWORD_RESET_URL?.replace(/\/$/, '') ??
            process.env.APP_FRONTEND_URL?.replace(/\/$/, '') ??
            'http://localhost:3001',
    };
});
//# sourceMappingURL=mail.config.js.map