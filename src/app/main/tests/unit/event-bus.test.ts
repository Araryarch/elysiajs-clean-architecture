import { describe, expect, it } from "bun:test";
import { EventBus, type DomainEventHandler } from "../../infrastructure/events/event-bus";
import { DomainEvent } from "../../domain/events/domain-event";

class TestEvent implements DomainEvent {
  occurredAt = new Date();
  eventType = "TestEvent";
  constructor(public value: string) {}
}

describe("EventBus", () => {
  it("dispatches an event to registered handler", async () => {
    const bus = new EventBus();
    let handled: TestEvent | null = null;

    bus.register({
      eventType: "TestEvent",
      handle: async (event: DomainEvent) => {
        handled = event as TestEvent;
      },
    });

    await bus.dispatch(new TestEvent("hello"));
    expect(handled).not.toBeNull();
    expect(handled!.value).toBe("hello");
  });

  it("dispatches to multiple handlers for same event type", async () => {
    const bus = new EventBus();
    const results: string[] = [];

    bus.register({
      eventType: "TestEvent",
      handle: async () => { results.push("handler1"); },
    });

    bus.register({
      eventType: "TestEvent",
      handle: async () => { results.push("handler2"); },
    });

    await bus.dispatch(new TestEvent("test"));
    expect(results).toEqual(["handler1", "handler2"]);
  });

  it("does not dispatch to handlers of different event types", async () => {
    const bus = new EventBus();
    let handled = false;

    bus.register({
      eventType: "OtherEvent",
      handle: async () => { handled = true; },
    });

    await bus.dispatch(new TestEvent("test"));
    expect(handled).toBe(false);
  });

  it("dispatches all events in batch", async () => {
    const bus = new EventBus();
    const handled: string[] = [];

    bus.register({
      eventType: "TestEvent",
      handle: async (event: DomainEvent) => {
        handled.push((event as TestEvent).value);
      },
    });

    await bus.dispatchAll([
      new TestEvent("first"),
      new TestEvent("second"),
    ]);

    expect(handled).toEqual(["first", "second"]);
  });
});

