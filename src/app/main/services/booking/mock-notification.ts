import { INotificationService } from "@/app/main/services/interfaces";

export function createMockNotificationService(): INotificationService {
  return {
    async sendEmail(params: { to: string; subject: string; body: string }): Promise<void> {
      console.log(`Sending email to ${params.to}: ${params.subject}`);
    },

    async sendWhatsApp(params: { to: string; message: string }): Promise<void> {
      console.log(`Sending WhatsApp to ${params.to}: ${params.message}`);
    },

    async sendBookingConfirmation(to, bookingDetails): Promise<void> {
      console.log(`[mock] Booking confirmation to ${to}: booking ${bookingDetails.bookingId}`);
    },

    async sendPaymentConfirmation(to, paymentDetails): Promise<void> {
      console.log(`[mock] Payment confirmation to ${to}: booking ${paymentDetails.bookingId}`);
    },

    async sendTicketDelivery(to, ticketDetails): Promise<void> {
      console.log(`[mock] Ticket delivery to ${to}: ticket ${ticketDetails.ticketCode}`);
    },

    async sendRefundApproval(to, refundDetails): Promise<void> {
      console.log(`[mock] Refund approval to ${to}: refund ${refundDetails.refundId}`);
    },

    async sendRefundRejection(to, refundDetails): Promise<void> {
      console.log(`[mock] Refund rejection to ${to}: refund ${refundDetails.refundId}`);
    },

    async sendEventReminder(to, reminderDetails): Promise<void> {
      console.log(`[mock] Event reminder to ${to}: ${reminderDetails.eventName}`);
    },
  };
}
