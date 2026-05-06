import { eq } from "drizzle-orm";
import { Event } from "@/domain/entities/event";
import { EventRepository } from "@/domain/repositories/event-repository";
import { TicketCategory } from "@/domain/entities/ticket-category";
import { DateRange } from "@/domain/value-objects/date-range";
import { Money } from "@/domain/value-objects/money";
import { db } from "@/infrastructure/database/connection";
import { events, ticketCategories } from "@/infrastructure/database/schema";

export class PostgresEventRepository implements EventRepository {
  async save(event: Event): Promise<void> {
    const json = event.toJSON();

    await db.transaction(async (tx) => {
      // Upsert event
      await tx
        .insert(events)
        .values({
          id: json.id,
          name: json.name,
          description: json.description,
          venue: json.venue,
          startAt: json.startAt,
          endAt: json.endAt,
          maxCapacity: json.maxCapacity,
          status: json.status,
          createdAt: json.createdAt,
        })
        .onConflictDoUpdate({
          target: events.id,
          set: {
            name: json.name,
            description: json.description,
            venue: json.venue,
            startAt: json.startAt,
            endAt: json.endAt,
            maxCapacity: json.maxCapacity,
            status: json.status,
          },
        });

      // Delete existing categories and insert new ones
      await tx.delete(ticketCategories).where(eq(ticketCategories.eventId, json.id));

      for (const cat of json.ticketCategories) {
        await tx.insert(ticketCategories).values({
          id: cat.id,
          eventId: json.id,
          name: cat.name,
          price: cat.price.toString(),
          currency: cat.currency,
          quota: cat.quota,
          bookedQuantity: cat.bookedQuantity,
          salesStart: cat.salesStart,
          salesEnd: cat.salesEnd,
          isActive: cat.isActive,
        });
      }
    });
  }

  async findById(id: string): Promise<Event | null> {
    const eventData = await db.query.events.findFirst({
      where: eq(events.id, id),
    });

    if (!eventData) return null;

    const categories = await db.query.ticketCategories.findMany({
      where: eq(ticketCategories.eventId, id),
    });

    return Event.fromPrimitives({
      ...eventData,
      status: eventData.status,
      ticketCategories: categories.map((cat) => ({
        id: cat.id,
        eventId: cat.eventId,
        name: cat.name,
        price: new Money(parseFloat(cat.price), cat.currency),
        quota: cat.quota,
        bookedQuantity: cat.bookedQuantity,
        salesPeriod: new DateRange(cat.salesStart, cat.salesEnd),
        isActive: cat.isActive,
      })),
    });
  }

  async findAll(): Promise<Event[]> {
    const allEvents = await db.query.events.findMany();
    const result: Event[] = [];

    for (const eventData of allEvents) {
      const categories = await db.query.ticketCategories.findMany({
        where: eq(ticketCategories.eventId, eventData.id),
      });

      result.push(
        Event.fromPrimitives({
          ...eventData,
          status: eventData.status,
          ticketCategories: categories.map((cat) => ({
            id: cat.id,
            eventId: cat.eventId,
            name: cat.name,
            price: new Money(parseFloat(cat.price), cat.currency),
            quota: cat.quota,
            bookedQuantity: cat.bookedQuantity,
            salesPeriod: new DateRange(cat.salesStart, cat.salesEnd),
            isActive: cat.isActive,
          })),
        })
      );
    }

    return result;
  }
}
