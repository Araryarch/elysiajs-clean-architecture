import { Event } from "@/domain/entities/event";
import { DateRange } from "@/domain/value-objects/date-range";
import type { EventRepository } from "@/domain/repositories/event-repository";

type EventRecord = ReturnType<Event["toJSON"]>;

export class InMemoryEventRepository implements EventRepository {
  private readonly events = new Map<string, EventRecord>();

  async findAll(): Promise<Event[]> {
    return [...this.events.values()].map((event) => Event.fromPrimitives({
      ...event,
      ticketCategories: event.ticketCategories.map((cat) => ({
        id: cat.id,
        eventId: cat.eventId,
        name: cat.name,
        price: cat.price,
        currency: cat.currency,
        quota: cat.quota,
        bookedQuantity: cat.bookedQuantity,
        salesStart: cat.salesStart,
        salesEnd: cat.salesEnd,
        isActive: cat.isActive,
      })),
    }));
  }

  async findById(id: string): Promise<Event | null> {
    const event = this.events.get(id);
    if (!event) return null;
    
    return Event.fromPrimitives({
      ...event,
      ticketCategories: event.ticketCategories.map((cat) => ({
        id: cat.id,
        eventId: cat.eventId,
        name: cat.name,
        price: cat.price,
        currency: cat.currency,
        quota: cat.quota,
        bookedQuantity: cat.bookedQuantity,
        salesStart: cat.salesStart,
        salesEnd: cat.salesEnd,
        isActive: cat.isActive,
      })),
    });
  }

  async save(event: Event): Promise<void> {
    this.events.set(event.id, event.toJSON());
  }

  async delete(id: string): Promise<void> {
    this.events.delete(id);
  }
}
