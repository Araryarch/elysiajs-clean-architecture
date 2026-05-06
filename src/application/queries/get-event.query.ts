import { NotFoundError } from "@/domain/errors/domain-error";
import { EventRepository } from "@/domain/repositories/event-repository";
import { EventDTO } from "@/application/dtos/dtos";
import { Query, QueryHandler } from "@/application/queries/query";

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
      startAt: json.startAt,
      endAt: json.endAt,
      maxCapacity: json.maxCapacity,
      status: json.status,
      ticketCategories: json.ticketCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        price: cat.price,
        currency: cat.currency,
        quota: cat.quota,
        availableQuantity: cat.availableQuantity,
        salesStart: cat.salesStart,
        salesEnd: cat.salesEnd,
        isActive: cat.isActive,
      })),
    };
  }
}
