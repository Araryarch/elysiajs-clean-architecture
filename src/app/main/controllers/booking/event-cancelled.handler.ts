import type { DomainEventHandler } from "@/app/main/shared/events/event-bus";
import type { EventCancelled } from "@/app/main/shared/types/events";
import { BookingStatus } from "@/app/main/entities/booking/booking-status";
import { TicketStatus } from "@/app/main/entities/ticket/ticket-status";
import type { BookingRepository } from "@/app/main/repositories/booking/booking-repository";
import type { ITicketRepository } from "@/app/main/repositories/ticket/ticket-repository";

/**
 * Reacts to EventCancelled domain event.
 * Marks all active tickets on paid bookings as RefundRequired.
 * Lives in the booking bounded context because it owns Booking + Ticket state.
 */
export class EventCancelledBookingHandler implements DomainEventHandler<EventCancelled> {
  readonly eventType = "EventCancelled";

  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly ticketRepository: ITicketRepository,
  ) {}

  async handle(event: EventCancelled): Promise<void> {
    const bookings = await this.bookingRepository.findByEventId(event.eventId);

    for (const booking of bookings) {
      if (booking.status !== BookingStatus.PAID) continue;

      const tickets = await this.ticketRepository.findByBookingId(booking.id);
      for (const ticket of tickets) {
        if (ticket.status === TicketStatus.ACTIVE) {
          ticket.markAsRefundRequired();
          await this.ticketRepository.save(ticket);
        }
      }
    }
  }
}
