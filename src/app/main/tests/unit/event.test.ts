import { describe, expect, it } from "bun:test";
import { Event } from "../../entities/event/event";
import { EventStatus } from "../../entities/event/event-status";
import { TicketCategory } from "../../entities/event/ticket-category";
import { Money } from "../../shared/utils/helpers/money";
import { DateRange } from "../../shared/utils/helpers/date-range";

const future = (days: number) => new Date(Date.now() + days * 86_400_000);

function makeEvent(overrides: Partial<Parameters<typeof Event.create>[0]> = {}) {
  return Event.create({
    id: "event_test-1",
    name: "Test Event",
    description: "A test event",
    venue: "Jakarta Convention Center",
    startAt: future(10),
    endAt: future(11),
    maxCapacity: 100,
    ticketCategories: [],
    ...overrides,
  });
}

function makeCategory(eventId: string, quota = 50) {
  return TicketCategory.create({
    id: "cat_test-1",
    eventId,
    name: "Regular",
    price: new Money(100_000),
    quota,
    salesPeriod: new DateRange(future(1), future(9)),
  });
}

describe("Event entity", () => {
  it("creates a draft event", () => {
    const event = makeEvent();
    expect(event.status).toBe(EventStatus.DRAFT);
  });

  it("emits EventCreated domain event on creation", () => {
    const event = makeEvent();
    const events = event.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]!.eventType).toBe("EventCreated");
  });

  it("throws when name is empty", () => {
    expect(() => makeEvent({ name: "  " })).toThrow("Event name is required");
  });

  it("throws when end is before start", () => {
    expect(() => makeEvent({ startAt: future(10), endAt: future(5) })).toThrow(
      "Event end time must be after start time",
    );
  });

  it("publishes a draft event with at least one active category", () => {
    const event = makeEvent();
    event.addTicketCategory(makeCategory(event.id));
    event.publish();
    expect(event.status).toBe(EventStatus.PUBLISHED);
  });

  it("throws when publishing without ticket categories", () => {
    const event = makeEvent();
    expect(() => event.publish()).toThrow("at least one active ticket category");
  });

  it("throws when publishing a non-draft event", () => {
    const event = makeEvent();
    event.addTicketCategory(makeCategory(event.id));
    event.publish();
    expect(() => event.publish()).toThrow("Only draft events can be published");
  });

  it("cancels a published event", () => {
    const event = makeEvent();
    event.addTicketCategory(makeCategory(event.id));
    event.publish();
    event.cancel();
    expect(event.status).toBe(EventStatus.CANCELLED);
  });

  it("throws when adding a category that exceeds capacity", () => {
    const event = makeEvent({ maxCapacity: 30 });
    expect(() => event.addTicketCategory(makeCategory(event.id, 50))).toThrow(
      "Total ticket quota exceeds event capacity",
    );
  });
});
