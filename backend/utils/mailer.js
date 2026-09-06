const nodemailer = require('nodemailer');
const twilio = require('twilio');

let transporter;

if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    secure: process.env.SMTP_SECURE === 'true' || false,
    auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    } : undefined
  });
} else {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

const sendEmail = async ({ to, subject, text, html }) => {
  if (!transporter) throw new Error('Mailer transporter not configured');

  const info = await transporter.sendMail({
    from: `"Tours & Travels Management" <${process.env.SMTP_USER || 'no-reply@example.com'}>`,
    to,
    subject,
    text,
    html
  });

  // If this was an Ethereal test account, log the preview URL for debugging
  try {
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) console.log('Ethereal preview URL:', preview);
  } catch (e) {
    // ignore
  }

  return info;
};

const sendSms = async ({ to, body }) => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    return null;
  }

  const client = twilio(sid, token);
  return await client.messages.create({
    body,
    from,
    to,
  });
};

const verifyMailer = async () => {
  await transporter.verify();
  return true;
};

module.exports = {
  sendEmail,
  sendSms,
  verifyMailer
};