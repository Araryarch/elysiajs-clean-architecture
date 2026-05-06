import { EventRepository } from "@/domain/repositories/event-repository";
import { BookingRepository } from "@/domain/repositories/booking-repository";
import { ITicketRepository } from "@/domain/repositories/ticket-repository";
import { IRefundRepository } from "@/domain/repositories/refund-repository";
import { EventStatus } from "@/domain/entities/event-status";
import { BookingStatus } from "@/domain/entities/booking-status";
import { Query, QueryHandler } from "@/application/queries/query";

export type DashboardStatsDTO = {
  events: {
    total: number;
    draft: number;
    published: number;
    cancelled: number;
    completed: number;
  };
  bookings: {
    total: number;
    pendingPayment: number;
    paid: number;
    expired: number;
    refunded: number;
  };
  tickets: {
    total: number;
    active: number;
    checkedIn: number;
    cancelled: number;
  };
  revenue: {
    total: number;
    currency: string;
    thisMonth: number;
  };
  refunds: {
    total: number;
    requested: number;
    approved: number;
    rejected: number;
    paidOut: number;
  };
};

export class GetDashboardStatsQuery implements Query {}

export class GetDashboardStatsHandler implements QueryHandler<GetDashboardStatsQuery, DashboardStatsDTO> {
  constructor(
    private eventRepository: EventRepository,
    private bookingRepository: BookingRepository,
    private ticketRepository: ITicketRepository,
    private refundRepository: IRefundRepository,
  ) {}

  async execute(): Promise<DashboardStatsDTO> {
    const events = await this.eventRepository.findAll();
    const bookings = await this.bookingRepository.findAll();
    const tickets = await this.ticketRepository.findAll();
    const refunds = await this.refundRepository.findAll();

    // Event stats
    const eventStats = {
      total: events.length,
      draft: events.filter((e) => e.status === EventStatus.DRAFT).length,
      published: events.filter((e) => e.status === EventStatus.PUBLISHED).length,
      cancelled: events.filter((e) => e.status === EventStatus.CANCELLED).length,
      completed: events.filter((e) => e.status === EventStatus.COMPLETED).length,
    };

    // Booking stats
    const bookingStats = {
      total: bookings.length,
      pendingPayment: bookings.filter((b) => b.status === BookingStatus.PENDING_PAYMENT).length,
      paid: bookings.filter((b) => b.status === BookingStatus.PAID).length,
      expired: bookings.filter((b) => b.status === BookingStatus.EXPIRED).length,
      refunded: bookings.filter((b) => b.status === BookingStatus.REFUNDED).length,
    };

    // Ticket stats
    const ticketStats = {
      total: tickets.length,
      active: tickets.filter((t) => t.toJSON().status === "Active").length,
      checkedIn: tickets.filter((t) => t.toJSON().status === "CheckedIn").length,
      cancelled: tickets.filter((t) => t.toJSON().status === "Cancelled").length,
    };

    // Revenue stats
    const totalRevenue = bookings
      .filter((b) => b.status === BookingStatus.PAID || b.status === BookingStatus.REFUNDED)
      .reduce((sum, b) => sum + b.toJSON().totalAmount, 0);

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthRevenue = bookings
      .filter((b) => {
        const paidAt = b.toJSON().paidAt;
        return (
          (b.status === BookingStatus.PAID || b.status === BookingStatus.REFUNDED) &&
          paidAt &&
          paidAt >= firstDayOfMonth
        );
      })
      .reduce((sum, b) => sum + b.toJSON().totalAmount, 0);

    // Refund stats
    const refundStats = {
      total: refunds.length,
      requested: refunds.filter((r) => r.status === "Requested").length,
      approved: refunds.filter((r) => r.status === "Approved").length,
      rejected: refunds.filter((r) => r.status === "Rejected").length,
      paidOut: refunds.filter((r) => r.status === "PaidOut").length,
    };

    return {
      events: eventStats,
      bookings: bookingStats,
      tickets: ticketStats,
      revenue: {
        total: totalRevenue,
        currency: "IDR",
        thisMonth: thisMonthRevenue,
      },
      refunds: refundStats,
    };
  }
}
