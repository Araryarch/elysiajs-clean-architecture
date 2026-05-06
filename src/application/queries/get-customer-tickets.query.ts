import { ITicketRepository } from "@/domain/repositories/ticket-repository";
import { EventRepository } from "@/domain/repositories/event-repository";
import { BookingRepository } from "@/domain/repositories/booking-repository";
import { TicketDTO } from "@/application/dtos/dtos";
import { Query, QueryHandler } from "@/application/queries/query";

export class GetCustomerTicketsQuery implements Query {
  constructor(public readonly customerEmail: string) {}
}

export class GetCustomerTicketsHandler implements QueryHandler<GetCustomerTicketsQuery, TicketDTO[]> {
  constructor(
    private ticketRepository: ITicketRepository,
    private eventRepository: EventRepository,
    private bookingRepository: BookingRepository,
  ) {}

  async execute(query: GetCustomerTicketsQuery): Promise<TicketDTO[]> {
    // Get all customer bookings
    const allBookings = await this.bookingRepository.findAll();
    const customerBookings = allBookings.filter(
      (b) => b.toJSON().customerEmail.toLowerCase() === query.customerEmail.toLowerCase(),
    );

    // Get all tickets for customer bookings
    const ticketDTOs: TicketDTO[] = [];
    for (const booking of customerBookings) {
      const tickets = await this.ticketRepository.findByBookingId(booking.id);
      
      for (const ticket of tickets) {
        const event = await this.eventRepository.findById(ticket.eventId);
        const json = ticket.toJSON();
        const category = event?.ticketCategories.find((c) => c.id === json.ticketCategoryId);

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

    // Sort by issued date (newest first)
    return ticketDTOs.sort((a, b) => 
      new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
    );
  }
}
