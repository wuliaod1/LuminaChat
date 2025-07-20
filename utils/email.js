const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) 创建一个 transporter
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // 2) 定义邮件选项
  const mailOptions = {
    from: `IM Service <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html: '<b>Hello world?</b>' // 如果需要发送HTML
  };

  // 3) 实际发送邮件
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
