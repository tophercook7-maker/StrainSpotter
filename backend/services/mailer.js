import nodemailer from 'nodemailer';

// Mailer service with simple provider selection via env
// Supported: SMTP (recommended minimal setup)
// Required envs (SMTP):
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, EMAIL_TO

function getSmtpTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return null;
  const port = Number(SMTP_PORT) || 587;
  const secure = port === 465; // true for 465, false for 587/25
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
}

export async function sendMail({ to, subject, text, html }) {
  const from = process.env.EMAIL_FROM || 'no-reply@strainspotter.app';
  const transport = getSmtpTransport();
  if (!transport) {
    console.warn('[mailer] SMTP not configured. Skipping email. Set SMTP_HOST/PORT/USER/PASS.');
    return { skipped: true };
  }
  const info = await transport.sendMail({ from, to, subject, text, html });
  return { id: info.messageId };
}

export function isEmailConfigured() {
  return Boolean(getSmtpTransport());
}
