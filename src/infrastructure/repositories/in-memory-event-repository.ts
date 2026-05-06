import { Event } from "@/domain/entities/event";
import type { EventRepository } from "@/domain/repositories/event-repository";

type EventRecord = ReturnType<Event["toJSON"]>;

export class InMemoryEventRepository implements EventRepository {
  private readonly events = new Map<string, EventRecord>();

  async findAll(): Promise<Event[]> {
    return [...this.events.values()].map((event) => this.toEntity(event));
  }

  async findById(id: string): Promise<Event | null> {
    const event = this.events.get(id);
    return event ? this.toEntity(event) : null;
  }

  async save(event: Event): Promise<void> {
    this.events.set(event.id, event.toJSON());
  }

  private toEntity(event: EventRecord) {
    return Event.fromPrimitives({
      ...event,
      startAt: new Date(event.startAt),
      endAt: new Date(event.endAt),
      createdAt: new Date(event.createdAt),
      ticketCategories: event.ticketCategories.map((category) => ({
        id: category.id,
        name: category.name,
        price: category.price,
        capacity: category.capacity,
        bookedQuantity: category.bookedQuantity,
      })),
    });
  }
}
