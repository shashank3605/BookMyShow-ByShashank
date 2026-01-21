const { model } = require("mongoose");
const nodemailer = require("nodemailer");

const mailSender = async (email, body) => {
  try {
    let transporter = nodemailer.transporter({
      host: process.env.MAIL_HOST,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: "BookMyShow - By <${process.env.MAIL_USER}>",
      to: `${email}`,
      subject: `OTP from BookMyShow`,
      html: `${body}`,
    });
    return info;
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = mailSender;
