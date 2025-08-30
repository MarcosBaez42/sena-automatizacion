import 'dotenv/config';

export const cfg = {
  sofiaUser: process.env.SOFIA_USER,
  sofiaPass: process.env.SOFIA_PASS,
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT || 587,
  outputDir: './downloads'
};