import { NotFoundError, DomainError } from "../../../shared/errors/domain-error";
import { BookingStatus } from "../../../entities/booking/booking-status";
import { BookingRepository } from "../repository/booking-repository";
import { EventRepository } from "../../event/repository/event-repository";
import { ITicketRepository } from "../../ticket/repository/ticket-repository";
import { TicketDTO } from "../../../shared/types/dtos";
import { Query, QueryHandler } from "../../../shared/interfaces/query";

export class GetTicketsByBookingQuery implements Query {
  constructor(public readonly bookingId: string) {}
}

export class GetTicketsByBookingHandler implements QueryHandler<GetTicketsByBookingQuery, TicketDTO[]> {
  constructor(
    private bookingRepository: BookingRepository,
    private ticketRepository: ITicketRepository,
    private eventRepository: EventRepository,
  ) {}

  async execute(query: GetTicketsByBookingQuery): Promise<TicketDTO[]> {
    const booking = await this.bookingRepository.findById(query.bookingId);
    if (!booking) {
      throw new NotFoundError("Booking", query.bookingId);
    }

    if (booking.status !== BookingStatus.PAID && booking.status !== BookingStatus.REFUNDED) {
      throw new DomainError(
        "Tickets can only be viewed for paid or refunded bookings",
        400,
        "INVALID_BOOKING_STATUS",
      );
    }

    const tickets = await this.ticketRepository.findByBookingId(query.bookingId);
    const event = await this.eventRepository.findById(booking.eventId);

    return tickets.map((ticket) => {
      const json = ticket.toJSON();
      const category = event?.ticketCategories.find((c) => c.id === json.ticketCategoryId);
      return {
        id: json.id,
        ticketCode: json.ticketCode,
        eventName: event?.toJSON().name || "Unknown",
        categoryName: category?.name || "Unknown",
        customerName: json.customerName,
        status: json.status,
        issuedAt: json.issuedAt.toISOString(),
        checkedInAt: json.checkedInAt?.toISOString(),
      };
    });
  }
}

