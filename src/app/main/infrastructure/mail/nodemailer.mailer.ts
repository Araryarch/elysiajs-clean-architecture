import nodemailer from "nodemailer";
import type { IMailer, MailParams } from "./mail.interface";
import { appConfig } from "@/app/main/config/app.config";

/**
 * Nodemailer-based mail implementation.
 * Configured via appConfig.mail (SMTP credentials from env vars).
 */
export class NodemailerMailer implements IMailer {
  private transporter = nodemailer.createTransport({
    host: appConfig.mail.host,
    port: appConfig.mail.port,
    auth: {
      user: appConfig.mail.user,
      pass: appConfig.mail.pass,
    },
  });

  async send(params: MailParams): Promise<void> {
    await this.transporter.sendMail({
      from: params.from ?? appConfig.mail.from,
      to: Array.isArray(params.to) ? params.to.join(", ") : params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
  }
}
