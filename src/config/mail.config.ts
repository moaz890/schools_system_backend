import { registerAs } from '@nestjs/config';

/**
 * Transactional email via Brevo **HTTP API** (not SMTP).
 * https://developers.brevo.com/reference/sendtransacemail
 *
 * Requires BREVO_API_KEY + MAIL_FROM (verified sender in Brevo).
 */
export default registerAs('mail', () => {
  const apiKey = (process.env.BREVO_API_KEY ?? '').trim();
  const from = (process.env.MAIL_FROM ?? '').trim();
  const explicitOff = process.env.MAIL_ENABLED === 'false';
  const enabled = !explicitOff && Boolean(apiKey && from);

  const apiBase =
    process.env.BREVO_API_BASE_URL?.replace(/\/$/, '') ??
    'https://api.brevo.com/v3';

  return {
    enabled,
    brevoApiKey: apiKey,
    brevoTransactionalEmailUrl: `${apiBase}/smtp/email`,
    from,
    /** Base URL of the web app; reset links go to `${base}/reset-password?userId=&token=` */
    frontendPasswordResetBaseUrl:
      process.env.FRONTEND_PASSWORD_RESET_URL?.replace(/\/$/, '') ??
      process.env.APP_FRONTEND_URL?.replace(/\/$/, '') ??
      'http://localhost:3001',
  };
});
