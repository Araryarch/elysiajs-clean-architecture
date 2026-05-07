import { NotFoundError } from "@/app/main/shared/errors/domain-error";
import { ITicketRepository } from "@/app/main/repositories/ticket/ticket-repository";
import { EventRepository } from "@/app/main/repositories/event/event-repository";
import { TicketDTO } from "@/app/main/shared/types/dtos";
import { Query, QueryHandler } from "@/app/main/shared/interfaces/query";

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
