import { ITicketRepository } from "@/app/main/repositories/ticket/ticket-repository";
import { EventRepository } from "@/app/main/repositories/event/event-repository";
import { TicketDTO } from "@/app/main/shared/types/dtos";
import { Query, QueryHandler } from "@/app/main/shared/interfaces/query";
import { PaginatedResult, paginate } from "@/app/main/shared/types/pagination.dto";

export class SearchTicketsQuery implements Query {
  constructor(
    public readonly ticketCode?: string,
    public readonly eventId?: string,
    public readonly status?: string,
    public readonly page?: number,
    public readonly limit?: number,
  ) {}
}

export class SearchTicketsHandler implements QueryHandler<SearchTicketsQuery, PaginatedResult<TicketDTO>> {
  constructor(
    private ticketRepository: ITicketRepository,
    private eventRepository: EventRepository,
  ) {}

  async execute(query: SearchTicketsQuery): Promise<PaginatedResult<TicketDTO>> {
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

    return paginate(ticketDTOs, query.page, query.limit);
  }
}
