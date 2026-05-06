import nodemailer from "nodemailer";
import { INotificationService } from "@/application/services/interfaces";

export class EmailNotificationService implements INotificationService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendEmail(params: { to: string; subject: string; body: string }): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || "noreply@eventtickets.com",
        to: params.to,
        subject: params.subject,
        html: params.body,
      });
      console.log(`Email sent to ${params.to}: ${params.subject}`);
    } catch (error) {
      console.error("Failed to send email:", error);
      // Don't throw error to prevent blocking the main flow
    }
  }

  async sendWhatsApp(params: { to: string; message: string }): Promise<void> {
    // Mock implementation - integrate with WhatsApp Business API in production
    console.log(`WhatsApp message to ${params.to}: ${params.message}`);
  }

  async sendBookingConfirmation(
    to: string,
    bookingDetails: {
      bookingId: string;
      eventName: string;
      customerName: string;
      totalAmount: number;
      paymentDeadline: Date;
    }
  ): Promise<void> {
    const subject = `Booking Confirmation - ${bookingDetails.eventName}`;
    const body = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 20px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; }
          .button { background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; display: inline-block; margin: 10px 0; }
          .info-row { margin: 10px 0; }
          .label { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Confirmed!</h1>
          </div>
          <div class="content">
            <p>Hi ${bookingDetails.customerName},</p>
            <p>Your booking has been successfully created. Please complete the payment before the deadline to secure your tickets.</p>
            
            <div class="info-row">
              <span class="label">Booking ID:</span> ${bookingDetails.bookingId}
            </div>
            <div class="info-row">
              <span class="label">Event:</span> ${bookingDetails.eventName}
            </div>
            <div class="info-row">
              <span class="label">Total Amount:</span> IDR ${bookingDetails.totalAmount.toLocaleString()}
            </div>
            <div class="info-row">
              <span class="label">Payment Deadline:</span> ${bookingDetails.paymentDeadline.toLocaleString()}
            </div>
            
            <p style="margin-top: 20px;">
              <a href="http://localhost:3000/bookings/${bookingDetails.bookingId}" class="button">Complete Payment</a>
            </p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>&copy; 2024 Event Ticketing System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({ to, subject, body });
  }

  async sendPaymentConfirmation(
    to: string,
    paymentDetails: {
      bookingId: string;
      eventName: string;
      customerName: string;
      totalAmount: number;
      paidAt: Date;
    }
  ): Promise<void> {
    const subject = `Payment Confirmed - ${paymentDetails.eventName}`;
    const body = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 20px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; }
          .success { background: #D1FAE5; border-left: 4px solid #10B981; padding: 15px; margin: 15px 0; }
          .info-row { margin: 10px 0; }
          .label { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Payment Successful!</h1>
          </div>
          <div class="content">
            <p>Hi ${paymentDetails.customerName},</p>
            <div class="success">
              <strong>Your payment has been confirmed!</strong> Your tickets will be sent to you shortly.
            </div>
            
            <div class="info-row">
              <span class="label">Booking ID:</span> ${paymentDetails.bookingId}
            </div>
            <div class="info-row">
              <span class="label">Event:</span> ${paymentDetails.eventName}
            </div>
            <div class="info-row">
              <span class="label">Amount Paid:</span> IDR ${paymentDetails.totalAmount.toLocaleString()}
            </div>
            <div class="info-row">
              <span class="label">Payment Date:</span> ${paymentDetails.paidAt.toLocaleString()}
            </div>
            
            <p style="margin-top: 20px;">Your tickets will be delivered to this email address within 5 minutes.</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>&copy; 2024 Event Ticketing System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({ to, subject, body });
  }

  async sendTicketDelivery(
    to: string,
    ticketDetails: {
      ticketCode: string;
      eventName: string;
      customerName: string;
      eventDate: Date;
      venue: string;
      qrCodeData: string;
    }
  ): Promise<void> {
    const subject = `Your Ticket - ${ticketDetails.eventName}`;
    const body = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .ticket { background: white; border: 2px solid #4F46E5; padding: 20px; margin: 20px 0; text-align: center; }
          .qr-code { margin: 20px 0; }
          .info-row { margin: 10px 0; text-align: left; }
          .label { font-weight: bold; }
          .footer { text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎟️ Your Ticket</h1>
          </div>
          <div class="ticket">
            <h2>${ticketDetails.eventName}</h2>
            <div class="qr-code">
              <img src="${ticketDetails.qrCodeData}" alt="QR Code" style="max-width: 200px;" />
            </div>
            <div class="info-row">
              <span class="label">Ticket Code:</span> ${ticketDetails.ticketCode}
            </div>
            <div class="info-row">
              <span class="label">Name:</span> ${ticketDetails.customerName}
            </div>
            <div class="info-row">
              <span class="label">Event Date:</span> ${ticketDetails.eventDate.toLocaleString()}
            </div>
            <div class="info-row">
              <span class="label">Venue:</span> ${ticketDetails.venue}
            </div>
          </div>
          <div class="content">
            <p><strong>Important:</strong></p>
            <ul>
              <li>Please show this QR code at the entrance</li>
              <li>Arrive at least 30 minutes before the event</li>
              <li>This ticket is non-transferable</li>
            </ul>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>&copy; 2024 Event Ticketing System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({ to, subject, body });
  }

  async sendRefundApproval(
    to: string,
    refundDetails: {
      refundId: string;
      bookingId: string;
      amount: number;
      approvedAt: Date;
    }
  ): Promise<void> {
    const subject = "Refund Approved";
    const body = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 20px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; }
          .info-row { margin: 10px 0; }
          .label { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Refund Approved</h1>
          </div>
          <div class="content">
            <p>Your refund request has been approved.</p>
            
            <div class="info-row">
              <span class="label">Refund ID:</span> ${refundDetails.refundId}
            </div>
            <div class="info-row">
              <span class="label">Booking ID:</span> ${refundDetails.bookingId}
            </div>
            <div class="info-row">
              <span class="label">Amount:</span> IDR ${refundDetails.amount.toLocaleString()}
            </div>
            <div class="info-row">
              <span class="label">Approved Date:</span> ${refundDetails.approvedAt.toLocaleString()}
            </div>
            
            <p>The refund will be processed within 3-5 business days.</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>&copy; 2024 Event Ticketing System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({ to, subject, body });
  }

  async sendRefundRejection(
    to: string,
    refundDetails: {
      refundId: string;
      bookingId: string;
      reason: string;
    }
  ): Promise<void> {
    const subject = "Refund Request Rejected";
    const body = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #EF4444; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 20px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; }
          .info-row { margin: 10px 0; }
          .label { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Refund Request Rejected</h1>
          </div>
          <div class="content">
            <p>Unfortunately, your refund request has been rejected.</p>
            
            <div class="info-row">
              <span class="label">Refund ID:</span> ${refundDetails.refundId}
            </div>
            <div class="info-row">
              <span class="label">Booking ID:</span> ${refundDetails.bookingId}
            </div>
            <div class="info-row">
              <span class="label">Reason:</span> ${refundDetails.reason}
            </div>
            
            <p>If you have any questions, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>&copy; 2024 Event Ticketing System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({ to, subject, body });
  }

  async sendEventReminder(
    to: string,
    reminderDetails: {
      eventName: string;
      eventDate: Date;
      venue: string;
      ticketCount: number;
    }
  ): Promise<void> {
    const subject = `Reminder: ${reminderDetails.eventName} is Tomorrow!`;
    const body = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #F59E0B; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 20px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; }
          .info-row { margin: 10px 0; }
          .label { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Event Reminder</h1>
          </div>
          <div class="content">
            <p>Don't forget! Your event is coming up soon.</p>
            
            <div class="info-row">
              <span class="label">Event:</span> ${reminderDetails.eventName}
            </div>
            <div class="info-row">
              <span class="label">Date:</span> ${reminderDetails.eventDate.toLocaleString()}
            </div>
            <div class="info-row">
              <span class="label">Venue:</span> ${reminderDetails.venue}
            </div>
            <div class="info-row">
              <span class="label">Your Tickets:</span> ${reminderDetails.ticketCount}
            </div>
            
            <p><strong>Reminders:</strong></p>
            <ul>
              <li>Arrive at least 30 minutes early</li>
              <li>Bring your ticket QR code</li>
              <li>Check the weather and dress accordingly</li>
            </ul>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>&copy; 2024 Event Ticketing System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({ to, subject, body });
  }
}
