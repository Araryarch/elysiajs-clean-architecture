import { INotificationService } from "@/application/services/interfaces";

export function createMockNotificationService(): INotificationService {
  return {
    async sendEmail(params: { to: string; subject: string; body: string }): Promise<void> {
      // Simulate email sending
      console.log(`Sending email to ${params.to}: ${params.subject}`);
      // In real implementation, this would call email service API (SendGrid, AWS SES, etc.)
    },

    async sendWhatsApp(params: { to: string; message: string }): Promise<void> {
      // Simulate WhatsApp sending
      console.log(`Sending WhatsApp to ${params.to}: ${params.message}`);
      // In real implementation, this would call WhatsApp Business API
    },
  };
}
