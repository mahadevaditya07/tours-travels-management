const nodemailer = require('nodemailer');
const twilio = require('twilio');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendEmail = async ({ to, subject, text, html }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error(
      'Gmail SMTP credentials are missing in backend/.env'
    );
  }

  return await transporter.sendMail({
    from: `"Tours & Travels Management" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html
  });
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