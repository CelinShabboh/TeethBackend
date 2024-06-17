import * as nodemailer from 'nodemailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'hipolito4@ethereal.email',
        pass: 'aKvktuctRhaZPVp2Bg'
      },
    });
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const resetLink = `http://yourfrontend.com/reset-password?token=${token}`;
    const mailOptions = {
      from: 'Auth-backend service',
      to: to,
      subject: 'Password Reset Request',
      html: ` <p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetLink}">Reset Password</a></p>`,
    };

    await this.transporter.sendMail(mailOptions);
  }
  async sendToken(to: string, token: string) {
    const resetLink = `http://yourfrontend.com/reset-password?token=${token}`;
    const mailOptions = {
      from: 'Auth-backend service',
      to: to,
      subject: 'verifyTheEmail',
      html: ` <p>To verify your email, use the code below:</p><p><a href="${resetLink}">Verify the email</a></p>`,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
