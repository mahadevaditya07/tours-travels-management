const nodemailer = require('nodemailer');

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

const verifyMailer = async () => {
  await transporter.verify();
  return true;
};

module.exports = {
  sendEmail,
  verifyMailer
};