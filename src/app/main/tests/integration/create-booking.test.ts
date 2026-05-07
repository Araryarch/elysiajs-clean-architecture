import { describe, expect, it, beforeEach } from "bun:test";
import { CreateBookingCommand, CreateBookingHandler } from "@/app/main/controllers/booking/create-booking.command";
import { Event } from "@/app/main/entities/event/event";
import { TicketCategory } from "@/app/main/entities/event/ticket-category";
import { Money } from "@/app/main/shared/utils/helpers/money";
import { DateRange } from "@/app/main/shared/utils/helpers/date-range";
import type { EventRepository } from "@/app/main/repositories/event/event-repository";
import type { BookingRepository } from "@/app/main/repositories/booking/booking-repository";
import type { Booking } from "@/app/main/entities/booking/booking";

// ── Minimal in-memory fakes ──────────────────────────────────────────────────

class FakeEventRepository implements EventRepository {
  private store = new Map<string, Event>();
  async findAll() { return [...this.store.values()]; }
  async findById(id: string) { return this.store.get(id) ?? null; }
  async save(event: Event) { this.store.set(event.id, event); }
  async delete(id: string) { this.store.delete(id); }
}

class FakeBookingRepository implements BookingRepository {
  private store = new Map<string, Booking>();
  async findAll() { return [...this.store.values()]; }
  async findById(id: string) { return this.store.get(id) ?? null; }
  async findByEventId(eventId: string) {
    return [...this.store.values()].filter((b) => b.eventId === eventId);
  }
  async findByCustomerEmail(email: string) {
    return [...this.store.values()].filter(
      (b) => b.toJSON().customerEmail.toLowerCase() === email.toLowerCase(),
    );
  }
  async findByEventAndCustomer(eventId: string, email: string) {
    return [...this.store.values()].filter(
      (b) => b.eventId === eventId && b.toJSON().customerEmail.toLowerCase() === email.toLowerCase(),
    );
  }
  async save(booking: Booking) { this.store.set(booking.id, booking); }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const future = (days: number) => new Date(Date.now() + days * 86_400_000);

function makePublishedEvent(id = "event_1"): Event {
  const event = Event.create({
    id,
    name: "Jakarta Tech Summit",
    description: "",
    venue: "JCC",
    startAt: future(10),
    endAt: future(11),
    maxCapacity: 100,
    ticketCategories: [],
  });

  const category = TicketCategory.create({
    id: "cat_1",
    eventId: id,
    name: "Regular",
    price: new Money(250_000),
    quota: 50,
    salesPeriod: new DateRange(future(1), future(9)),
  });

  event.addTicketCategory(category);
  event.publish();
  event.clearDomainEvents();
  return event;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("CreateBookingHandler (integration)", () => {
  let eventRepo: FakeEventRepository;
  let bookingRepo: FakeBookingRepository;
  let handler: CreateBookingHandler;

  beforeEach(() => {
    eventRepo = new FakeEventRepository();
    bookingRepo = new FakeBookingRepository();
    handler = new CreateBookingHandler(eventRepo, bookingRepo);
  });

  it("creates a booking and reserves ticket quota", async () => {
    const event = makePublishedEvent();
    await eventRepo.save(event);

    const bookingId = await handler.execute(
      new CreateBookingCommand("event_1", "Andi", "andi@example.com", [
        { ticketCategoryId: "cat_1", quantity: 2 },
      ]),
    );

    expect(bookingId).toStartWith("booking_");

    // Quota should be reduced
    const updatedEvent = await eventRepo.findById("event_1");
    const cat = updatedEvent!.ticketCategories.find((c) => c.id === "cat_1")!;
    expect(cat.bookedQuantity).toBe(2);
    expect(cat.availableQuantity).toBe(48);
  });

  it("throws when event does not exist", async () => {
    await expect(
      handler.execute(
        new CreateBookingCommand("nonexistent", "Andi", "andi@example.com", [
          { ticketCategoryId: "cat_1", quantity: 1 },
        ]),
      ),
    ).rejects.toThrow("not found");
  });

  it("throws when customer already has an active booking", async () => {
    const event = makePublishedEvent();
    await eventRepo.save(event);

    await handler.execute(
      new CreateBookingCommand("event_1", "Andi", "andi@example.com", [
        { ticketCategoryId: "cat_1", quantity: 1 },
      ]),
    );

    await expect(
      handler.execute(
        new CreateBookingCommand("event_1", "Andi", "andi@example.com", [
          { ticketCategoryId: "cat_1", quantity: 1 },
        ]),
      ),
    ).rejects.toThrow("active booking");
  });

  it("throws when requested quantity exceeds available quota", async () => {
    const event = makePublishedEvent();
    await eventRepo.save(event);

    await expect(
      handler.execute(
        new CreateBookingCommand("event_1", "Andi", "andi@example.com", [
          { ticketCategoryId: "cat_1", quantity: 99 },
        ]),
      ),
    ).rejects.toThrow("available");
  });
});
