require('dotenv').config();
const nodemailer = require('nodemailer');

// configure the AttHost transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Send email via AttHost SMTP
 */
function sendEmail({ to, subject, html, text }) {
  return transporter
    .sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      html,
      text: text || html?.replace(/<[^>]+>/g, ' ').trim()
    })
    .then(info => {
      console.log('[MAILER] Message sent:', info.messageId);
      return info;
    })
    .catch(err => {
      console.error('[MAILER] Send error:', err.message || err);
      throw err;
    });
}

module.exports = { sendEmail };
