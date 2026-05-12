import { NotFoundError } from "../../../domain/errors/domain-error";
import { EventRepository } from "../repository/event-repository";
import { EventDTO } from "../../../application/types/dtos";
import { Query, QueryHandler } from "../../../application/interfaces/query";

export class GetEventQuery implements Query {
  constructor(public readonly eventId: string) {}
}

export class GetEventHandler implements QueryHandler<GetEventQuery, EventDTO> {
  constructor(private eventRepository: EventRepository) {}

  async execute(query: GetEventQuery): Promise<EventDTO> {
    const event = await this.eventRepository.findById(query.eventId);
    if (!event) {
      throw new NotFoundError("Event", query.eventId);
    }

    const json = event.toJSON();
    return {
      id: json.id,
      name: json.name,
      description: json.description,
      venue: json.venue,
      startAt: json.startAt.toISOString(),
      endAt: json.endAt.toISOString(),
      maxCapacity: json.maxCapacity,
      status: json.status,
      ticketCategories: json.ticketCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        price: cat.price,
        currency: cat.currency,
        quota: cat.quota,
        availableQuantity: cat.availableQuantity,
        salesStart: cat.salesStart.toISOString(),
        salesEnd: cat.salesEnd.toISOString(),
        isActive: cat.isActive,
      })),
    };
  }
}
