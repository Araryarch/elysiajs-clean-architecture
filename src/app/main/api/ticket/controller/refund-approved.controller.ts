import type { DomainEventHandler } from "../../../shared/events/event-bus";
import type { RefundApproved } from "../../../shared/types/events";
import { TicketStatus } from "../../../entities/ticket/ticket-status";
import type { IRefundRepository } from "../../refund/repository/refund-repository";
import type { BookingRepository } from "../../booking/repository/booking-repository";
import type { ITicketRepository } from "../repository/ticket-repository";

export class RefundApprovedTicketHandler implements DomainEventHandler<RefundApproved> {
  readonly eventType = "RefundApproved";

  constructor(
    private readonly refundRepository: IRefundRepository,
    private readonly bookingRepository: BookingRepository,
    private readonly ticketRepository: ITicketRepository,
  ) {}

  async handle(event: RefundApproved): Promise<void> {
    const refund = await this.refundRepository.findById(event.refundId);
    if (!refund) return;

    const booking = await this.bookingRepository.findById(refund.bookingId);
    if (!booking) return;

    booking.markAsRefunded();
    await this.bookingRepository.save(booking);

    const tickets = await this.ticketRepository.findByBookingId(refund.bookingId);
    for (const ticket of tickets) {
      if (ticket.status !== TicketStatus.CHECKED_IN) {
        ticket.cancel();
        await this.ticketRepository.save(ticket);
      }
    }
  }
}

