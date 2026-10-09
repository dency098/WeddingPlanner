const nodemailer = require('nodemailer');

const createTransporter = async () => {
  const emailHost = process.env.EMAIL_HOST;
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;

  if (emailHost && emailUser && emailPassword) {
    return nodemailer.createTransport({
      host: emailHost,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });
  }

  const testAccount = await nodemailer.createTestAccount();

  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = await createTransporter();

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Wedding Planner <noreply@weddingplanner.local>',
    to,
    subject,
    text,
    html,
  });

  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('Email preview URL:', nodemailer.getTestMessageUrl(info));
  }

  return info;
};

module.exports = { sendEmail };
