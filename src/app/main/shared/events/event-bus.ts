import type { DomainEvent } from "@/app/main/shared/types/domain-event";

export interface DomainEventHandler<T extends DomainEvent = DomainEvent> {
  eventType: string;
  handle(event: T): Promise<void>;
}

/**
 * Simple in-process synchronous event bus.
 * Handlers are registered per event type and called in registration order.
 */
export class EventBus {
  private handlers = new Map<string, DomainEventHandler[]>();

  register(handler: DomainEventHandler): void {
    const existing = this.handlers.get(handler.eventType) ?? [];
    this.handlers.set(handler.eventType, [...existing, handler]);
  }

  async dispatch(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) ?? [];
    for (const handler of handlers) {
      await handler.handle(event);
    }
  }

  async dispatchAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.dispatch(event);
    }
  }
}

/** Singleton event bus instance shared across the application. */
export const eventBus = new EventBus();
