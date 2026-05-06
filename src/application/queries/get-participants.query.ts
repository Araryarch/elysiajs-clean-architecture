import { NotFoundError } from "@/domain/errors/domain-error";
import { BookingStatus } from "@/domain/entities/booking-status";
import { TicketStatus } from "@/domain/entities/ticket-status";
import { EventRepository } from "@/domain/repositories/event-repository";
import { BookingRepository } from "@/domain/repositories/booking-repository";
import { ITicketRepository } from "@/domain/repositories/ticket-repository";
import { ParticipantDTO } from "@/application/dtos/dtos";
import { Query, QueryHandler } from "@/application/queries/query";

export class GetParticipantsQuery implements Query {
  constructor(public readonly eventId: string) {}
}

export class GetParticipantsHandler implements QueryHandler<GetParticipantsQuery, ParticipantDTO[]> {
  constructor(
    private eventRepository: EventRepository,
    private bookingRepository: BookingRepository,
    private ticketRepository: ITicketRepository,
  ) {}

  async execute(query: GetParticipantsQuery): Promise<ParticipantDTO[]> {
    const event = await this.eventRepository.findById(query.eventId);
    if (!event) {
      throw new NotFoundError("Event", query.eventId);
    }

    const bookings = await this.bookingRepository.findByEventId(query.eventId);
    const paidBookings = bookings.filter((b) => b.status === BookingStatus.PAID);

    const participants: ParticipantDTO[] = [];

    for (const booking of paidBookings) {
      const tickets = await this.ticketRepository.findByBookingId(booking.id);

      for (const ticket of tickets) {
        const category = event.ticketCategories.find(
          (c) => c.id === ticket.toJSON().ticketCategoryId,
        );

        participants.push({
          customerName: ticket.toJSON().customerName,
          customerEmail: booking.toJSON().customerEmail,
          ticketCategory: category?.name || "Unknown",
          ticketCode: ticket.ticketCode.value,
          checkedIn: ticket.status === TicketStatus.CHECKED_IN,
        });
      }
    }

    return participants;
  }
}
