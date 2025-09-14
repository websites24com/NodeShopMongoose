require('dotenv').config();
const nodemailer = require('nodemailer');

// configure the Gmail transporter with app password
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, '') // strip spaces
  }
});

/**
 * Send email via Gmail SMTP (returns a Promise).
 * Usage:
 *   sendEmail({to, subject, html})
 *     .then(info => console.log(info))
 *     .catch(err => console.error(err));
 */
function sendEmail({ to, subject, html, text }) {
  return transporter
    .sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      html,
      text: text || html?.replace(/<[^>]+>/g, ' ').trim() // fallback plain text
    })
    .then(info => {
      console.log('[MAILER] Message sent:', info.messageId);
      return info;
    })
    .catch(err => {
      console.error('[MAILER] Send error:', err && err.message ? err.message : err);
      throw err; // rethrow so controller .catch() can handle
    });
}

module.exports = { sendEmail };
