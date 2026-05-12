import type { DomainEventHandler } from "../../../shared/events/event-bus";
import type { EventCancelled } from "../../../shared/types/events";
import { BookingStatus } from "../../../entities/booking/booking-status";
import { TicketStatus } from "../../../entities/ticket/ticket-status";
import type { BookingRepository } from "../repository/booking-repository";
import type { ITicketRepository } from "../../ticket/repository/ticket-repository";

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

