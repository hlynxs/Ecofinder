const nodemailer = require('nodemailer');
const pdf = require('html-pdf');

const sendEmail = async ({ email, subject, message, attachPdf = false, pdfFilename = 'receipt.pdf' }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: '"Drift n\' Dash" <noreply@driftdash.com>',
    to: email,
    subject: subject,
    html: message
  };

  // If PDF attachment is requested
  if (attachPdf) {
    const options = { format: 'A4', border: '10mm' };

    // Convert HTML to PDF Buffer
    await new Promise((resolve, reject) => {
      pdf.create(message, options).toBuffer((err, buffer) => {
        if (err) return reject(err);

        mailOptions.attachments = [{
          filename: pdfFilename,
          content: buffer,
          contentType: 'application/pdf'
        }];

        resolve();
      });
    });
  }

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
