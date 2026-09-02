const nodemailer = require('nodemailer');
const Twilio = require('twilio');

let transporter;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

async function sendEmail({ to, subject, html, text }) {
  if (!transporter) {
    console.log('Mailer not configured, email content:', { to, subject, text, html });
    return;
  }

  return transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, text, html });
}

async function sendSms({ to, body }) {
  if (!twilioClient) {
    console.log('Twilio not configured, sms content:', { to, body });
    return;
  }

  return twilioClient.messages.create({ body, from: process.env.TWILIO_FROM, to });
}

module.exports = { sendEmail, sendSms };
