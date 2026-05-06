import { NotFoundError } from "@/domain/errors/domain-error";
import { BookingStatus } from "@/domain/entities/booking-status";
import { TicketStatus } from "@/domain/entities/ticket-status";
import { EventRepository } from "@/domain/repositories/event-repository";
import { BookingRepository } from "@/domain/repositories/booking-repository";
import { ITicketRepository } from "@/domain/repositories/ticket-repository";
import { Command, CommandHandler } from "@/application/commands/command";

export class CancelEventCommand implements Command {
  constructor(public readonly eventId: string) {}
}

export class CancelEventHandler implements CommandHandler<CancelEventCommand> {
  constructor(
    private eventRepository: EventRepository,
    private bookingRepository: BookingRepository,
    private ticketRepository: ITicketRepository,
  ) {}

  async execute(command: CancelEventCommand): Promise<void> {
    const event = await this.eventRepository.findById(command.eventId);
    if (!event) {
      throw new NotFoundError("Event", command.eventId);
    }

    event.cancel();
    await this.eventRepository.save(event);

    // US3: Paid bookings must be marked as requiring a refund
    const bookings = await this.bookingRepository.findByEventId(command.eventId);
    for (const booking of bookings) {
      if (booking.status === BookingStatus.PAID) {
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
}
