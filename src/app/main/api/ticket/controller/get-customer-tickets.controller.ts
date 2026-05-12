import { ITicketRepository } from "../repository/ticket-repository";
import { EventRepository } from "../../event/repository/event-repository";
import { BookingRepository } from "../../booking/repository/booking-repository";
import { TicketDTO } from "../../../application/types/dtos";
import { Query, QueryHandler } from "../../../application/interfaces/query";

export class GetCustomerTicketsQuery implements Query {
  constructor(public readonly customerEmail: string) {}
}

export class GetCustomerTicketsHandler implements QueryHandler<
  GetCustomerTicketsQuery,
  TicketDTO[]
> {
  constructor(
    private ticketRepository: ITicketRepository,
    private eventRepository: EventRepository,
    private bookingRepository: BookingRepository,
  ) {}

  async execute(query: GetCustomerTicketsQuery): Promise<TicketDTO[]> {
    const customerBookings = await this.bookingRepository.findByCustomerEmail(
      query.customerEmail,
    );

    const ticketDTOs: TicketDTO[] = [];
    for (const booking of customerBookings) {
      const tickets = await this.ticketRepository.findByBookingId(booking.id);

      for (const ticket of tickets) {
        const event = await this.eventRepository.findById(ticket.eventId);
        const json = ticket.toJSON();
        const category = event?.ticketCategories.find(
          (c) => c.id === json.ticketCategoryId,
        );

        ticketDTOs.push({
          id: json.id,
          ticketCode: json.ticketCode,
          eventName: event?.toJSON().name || "Unknown",
          categoryName: category?.name || "Unknown",
          customerName: json.customerName,
          status: json.status,
          issuedAt: json.issuedAt.toISOString(),
          checkedInAt: json.checkedInAt?.toISOString(),
        });
      }
    }

    return ticketDTOs.sort(
      (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime(),
    );
  }
}
