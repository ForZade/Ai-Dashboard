import nodemailer from "nodemailer";

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: { 
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  }

  async sendEmail({to, subject, html}: { to: string, subject: string, html: string }) {
    const mailOptions = {
      from: process.env.MAIL_USER,
      to,
      subject,
      html,
    };

    const info = await this.transporter.sendMail(mailOptions);
    return info;
  }
}

export const emailService = new EmailService();