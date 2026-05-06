export interface IPaymentGateway {
  processPayment(params: { bookingId: string; amount: number }): Promise<string>;
}

export interface IRefundPaymentService {
  processRefund(params: { refundId: string; amount: number }): Promise<string>;
}

export interface INotificationService {
  sendEmail(params: { to: string; subject: string; body: string }): Promise<void>;
  sendWhatsApp(params: { to: string; message: string }): Promise<void>;
}
