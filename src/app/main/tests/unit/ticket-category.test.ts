import { describe, expect, it } from "bun:test";
import { TicketCategory } from "../../entities/event/ticket-category";
import { Money } from "../../shared/utils/helpers/money";
import { DateRange } from "../../shared/utils/helpers/date-range";
import { makeCategory, past, future } from "../helpers/test-factory";

describe("TicketCategory entity", () => {
  it("creates a category with zero booked quantity and active", () => {
    const cat = makeCategory("event-1");
    expect(cat.bookedQuantity).toBe(0);
    expect(cat.isActive).toBe(true);
    expect(cat.availableQuantity).toBe(50);
  });

  it("emits TicketCategoryCreated domain event", () => {
    const cat = makeCategory("event-1");
    const events = cat.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]!.eventType).toBe("TicketCategoryCreated");
  });

  it("throws when price is negative", () => {
    expect(() => makeCategory("event-1", { price: new Money(-100) })).toThrow("Amount cannot be negative");
  });

  it("throws when quota is zero or negative", () => {
    expect(() => makeCategory("event-1", { quota: 0 })).toThrow("Ticket quota must be greater than zero");
    expect(() => makeCategory("event-1", { quota: -5 })).toThrow("Ticket quota must be greater than zero");
  });

  it("can be purchased when active and within sales period", () => {
    const cat = makeCategory("event-1", { salesPeriod: new DateRange(past(1), future(1)) });
    expect(cat.canBePurchased()).toBe(true);
  });

  it("cannot be purchased when inactive", () => {
    const cat = makeCategory("event-1");
    cat.disable();
    expect(cat.canBePurchased()).toBe(false);
  });

  it("disables a category", () => {
    const cat = makeCategory("event-1");
    cat.disable();
    expect(cat.isActive).toBe(false);
  });

  it("emits TicketCategoryDisabled on disable", () => {
    const cat = makeCategory("event-1");
    cat.clearDomainEvents();
    cat.disable();
    const events = cat.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]!.eventType).toBe("TicketCategoryDisabled");
  });

  it("throws when disabling already disabled category", () => {
    const cat = makeCategory("event-1");
    cat.disable();
    expect(() => cat.disable()).toThrow("Ticket category is already disabled");
  });

  it("reserves tickets reducing available quantity", () => {
    const cat = makeCategory("event-1");
    cat.reserve(10);
    expect(cat.bookedQuantity).toBe(10);
    expect(cat.availableQuantity).toBe(40);
  });

  it("throws when reserving more than available", () => {
    const cat = makeCategory("event-1", { quota: 50 });
    expect(() => cat.reserve(60)).toThrow("Only 50 Regular tickets available");
  });

  it("throws when reserving from inactive category", () => {
    const cat = makeCategory("event-1");
    cat.disable();
    expect(() => cat.reserve(1)).toThrow("Cannot reserve tickets from inactive category");
  });

  it("releases tickets", () => {
    const cat = makeCategory("event-1");
    cat.reserve(10);
    cat.release(5);
    expect(cat.bookedQuantity).toBe(5);
  });

  it("does not go below zero on release", () => {
    const cat = makeCategory("event-1");
    cat.release(100);
    expect(cat.bookedQuantity).toBe(0);
  });

  it("updates name", () => {
    const cat = makeCategory("event-1");
    cat.updateName("VIP");
    expect(cat.name).toBe("VIP");
  });

  it("updates price", () => {
    const cat = makeCategory("event-1");
    cat.updatePrice(200_000);
    expect(cat.price.amount).toBe(200_000);
  });

  it("updates quota above booked quantity", () => {
    const cat = makeCategory("event-1");
    cat.reserve(10);
    cat.updateQuota(30);
    expect(cat.quota).toBe(30);
  });

  it("throws when reducing quota below booked quantity", () => {
    const cat = makeCategory("event-1");
    cat.reserve(40);
    expect(() => cat.updateQuota(30)).toThrow("Cannot reduce quota below booked quantity");
  });

  it("serializes to JSON", () => {
    const cat = makeCategory("event-1", { id: "cat-json-1" });
    const json = cat.toJSON();
    expect(json.id).toBe("cat-json-1");
    expect(json.availableQuantity).toBe(50);
  });

  it("restores from primitives", () => {
    const cat = TicketCategory.fromPrimitives({
      id: "cat-restore-1",
      name: "Restored",
      price: 150_000,
      quota: 100,
      bookedQuantity: 20,
      salesPeriod: { start: future(1), end: future(9) },
      isActive: true,
    });
    expect(cat.id).toBe("cat-restore-1");
    expect(cat.availableQuantity).toBe(80);
  });
});
