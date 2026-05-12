import { ITicketRepository } from "../repository/ticket-repository";
import { EventRepository } from "../../event/repository/event-repository";
import { TicketDTO } from "../../../application/types/dtos";
import { Query, QueryHandler } from "../../../application/interfaces/query";
import {
  PaginatedResult,
  paginate,
} from "../../../application/types/pagination.dto";

export class SearchTicketsQuery implements Query {
  constructor(
    public readonly ticketCode?: string,
    public readonly eventId?: string,
    public readonly status?: string,
    public readonly page?: number,
    public readonly limit?: number,
  ) {}
}

export class SearchTicketsHandler implements QueryHandler<
  SearchTicketsQuery,
  PaginatedResult<TicketDTO>
> {
  constructor(
    private ticketRepository: ITicketRepository,
    private eventRepository: EventRepository,
  ) {}

  async execute(
    query: SearchTicketsQuery,
  ): Promise<PaginatedResult<TicketDTO>> {
    let tickets = await this.ticketRepository.findAll();

    if (query.ticketCode) {
      tickets = tickets.filter(
        (t) =>
          t.toJSON().ticketCode.toLowerCase() ===
          query.ticketCode!.toLowerCase(),
      );
    }

    if (query.eventId) {
      tickets = tickets.filter((t) => t.eventId === query.eventId);
    }

    if (query.status) {
      tickets = tickets.filter((t) => t.toJSON().status === query.status);
    }

    const ticketDTOs: TicketDTO[] = [];
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

    return paginate(ticketDTOs, query.page, query.limit);
  }
}
