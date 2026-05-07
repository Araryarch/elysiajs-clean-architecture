import type { DomainEventHandler } from "@/app/main/shared/events/event-bus";
import type { RefundApproved } from "@/app/main/shared/types/events";
import { TicketStatus } from "@/app/main/entities/ticket/ticket-status";
import type { IRefundRepository } from "@/app/main/repositories/refund/refund-repository";
import type { BookingRepository } from "@/app/main/repositories/booking/booking-repository";
import type { ITicketRepository } from "@/app/main/repositories/ticket/ticket-repository";

/**
 * Reacts to RefundApproved domain event.
 * Marks the booking as refunded and cancels all non-checked-in tickets.
 * Lives in the ticket bounded context because it owns Ticket state.
 */
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
