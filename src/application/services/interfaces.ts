export interface IPaymentGateway {
  processPayment(params: { bookingId: string; amount: number }): Promise<string>;
}

export interface IRefundPaymentService {
  processRefund(params: { refundId: string; amount: number }): Promise<string>;
}

export interface INotificationService {
  sendEmail(params: { to: string; subject: string; body: string }): Promise<void>;
  sendWhatsApp(params: { to: string; message: string }): Promise<void>;
  
  // Specific notification methods
  sendBookingConfirmation(to: string, bookingDetails: {
    bookingId: string;
    eventName: string;
    customerName: string;
    totalAmount: number;
    paymentDeadline: Date;
  }): Promise<void>;

  sendPaymentConfirmation(to: string, paymentDetails: {
    bookingId: string;
    eventName: string;
    customerName: string;
    totalAmount: number;
    paidAt: Date;
  }): Promise<void>;

  sendTicketDelivery(to: string, ticketDetails: {
    ticketCode: string;
    eventName: string;
    customerName: string;
    eventDate: Date;
    venue: string;
    qrCodeData: string;
  }): Promise<void>;

  sendRefundApproval(to: string, refundDetails: {
    refundId: string;
    bookingId: string;
    amount: number;
    approvedAt: Date;
  }): Promise<void>;

  sendRefundRejection(to: string, refundDetails: {
    refundId: string;
    bookingId: string;
    reason: string;
  }): Promise<void>;

  sendEventReminder(to: string, reminderDetails: {
    eventName: string;
    eventDate: Date;
    venue: string;
    ticketCount: number;
  }): Promise<void>;
}

export interface IQRCodeService {
  generateQRCode(data: string): Promise<string>; // Returns base64 encoded image
}
