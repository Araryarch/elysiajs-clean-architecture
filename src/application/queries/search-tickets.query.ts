import { ITicketRepository } from "@/domain/repositories/ticket-repository";
import { EventRepository } from "@/domain/repositories/event-repository";
import { TicketDTO } from "@/application/dtos/dtos";
import { Query, QueryHandler } from "@/application/queries/query";

export class SearchTicketsQuery implements Query {
  constructor(
    public readonly ticketCode?: string,
    public readonly eventId?: string,
    public readonly status?: string,
  ) {}
}

export class SearchTicketsHandler implements QueryHandler<SearchTicketsQuery, TicketDTO[]> {
  constructor(
    private ticketRepository: ITicketRepository,
    private eventRepository: EventRepository,
  ) {}

  async execute(query: SearchTicketsQuery): Promise<TicketDTO[]> {
    let tickets = await this.ticketRepository.findAll();

    // Filter by ticket code
    if (query.ticketCode) {
      tickets = tickets.filter(
        (t) => t.toJSON().ticketCode.toLowerCase() === query.ticketCode!.toLowerCase(),
      );
    }

    // Filter by event ID
    if (query.eventId) {
      tickets = tickets.filter((t) => t.eventId === query.eventId);
    }

    // Filter by status
    if (query.status) {
      tickets = tickets.filter((t) => t.toJSON().status === query.status);
    }

    // Map to DTOs
    const ticketDTOs: TicketDTO[] = [];
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

    return ticketDTOs;
  }
}
