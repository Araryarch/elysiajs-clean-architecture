import { NotFoundError, DomainError } from "@/app/main/shared/errors/domain-error";
import { BookingStatus } from "@/app/main/entities/booking/booking-status";
import { BookingRepository } from "@/app/main/repositories/booking/booking-repository";
import { EventRepository } from "@/app/main/repositories/event/event-repository";
import { ITicketRepository } from "@/app/main/repositories/ticket/ticket-repository";
import { TicketDTO } from "@/app/main/shared/types/dtos";
import { Query, QueryHandler } from "@/app/main/shared/interfaces/query";

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

    // Customers can only view tickets from bookings with status Paid (AC from US12)
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
