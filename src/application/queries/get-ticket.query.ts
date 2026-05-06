import { NotFoundError } from "@/domain/errors/domain-error";
import { ITicketRepository } from "@/domain/repositories/ticket-repository";
import { EventRepository } from "@/domain/repositories/event-repository";
import { TicketDTO } from "@/application/dtos/dtos";
import { Query, QueryHandler } from "@/application/queries/query";

export class GetTicketQuery implements Query {
  constructor(public readonly ticketId: string) {}
}

export class GetTicketHandler implements QueryHandler<GetTicketQuery, TicketDTO> {
  constructor(
    private ticketRepository: ITicketRepository,
    private eventRepository: EventRepository,
  ) {}

  async execute(query: GetTicketQuery): Promise<TicketDTO> {
    const ticket = await this.ticketRepository.findById(query.ticketId);
    if (!ticket) {
      throw new NotFoundError("Ticket", query.ticketId);
    }

    const event = await this.eventRepository.findById(ticket.eventId);
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
  }
}
