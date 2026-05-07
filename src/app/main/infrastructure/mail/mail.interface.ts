/**
 * Mail sender interface.
 * Implementations can be Nodemailer, Resend, SendGrid, etc.
 */
export interface IMailer {
  send(params: MailParams): Promise<void>;
}

export type MailParams = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
};
