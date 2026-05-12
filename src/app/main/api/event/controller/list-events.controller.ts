import { EventStatus } from "../../../entities/event/event-status";
import { EventRepository } from "../repository/event-repository";
import { EventDTO } from "../../../shared/types/dtos";
import { Query, QueryHandler } from "../../../shared/interfaces/query";

export class ListEventsQuery implements Query {
  constructor(
    public readonly status?: string,
    public readonly location?: string,
    public readonly date?: string,
  ) {}
}

export class ListEventsHandler implements QueryHandler<ListEventsQuery, EventDTO[]> {
  constructor(private eventRepository: EventRepository) {}

  async execute(query: ListEventsQuery): Promise<EventDTO[]> {
    let events = await this.eventRepository.findAll();

    const statusFilter = query.status || EventStatus.PUBLISHED;
    events = events.filter((e) => e.status === statusFilter);

    if (query.location) {
      events = events.filter((e) =>
        e.toJSON().venue.toLowerCase().includes(query.location!.toLowerCase()),
      );
    }

    if (query.date) {
      const filterDate = new Date(query.date);
      if (!isNaN(filterDate.getTime())) {
        events = events.filter((e) => {
          const json = e.toJSON();

          return json.endAt >= filterDate;
        });
      }
    }

    return events.map((event) => {
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
    });
  }
}

