import { DomainError } from "../../shared/errors/domain-error";
import { DomainEvent } from "../../shared/types/domain-event";
import {
  EventCancelled,
  EventCreated,
  EventPublished,
} from "../../shared/types/events";
import { Money } from "../../shared/utils/helpers/money";
import { EventStatus } from "./event-status";
import {
  TicketCategory,
  type TicketCategoryProps,
} from "./ticket-category";

export type EventProps = {
  id: string;
  name: string;
  description?: string;
  venue: string;
  startAt: Date;
  endAt: Date;
  maxCapacity: number;
  status: EventStatus;
  ticketCategories: TicketCategory[];
  createdAt: Date;
};

export type EventSnapshot = Omit<EventProps, "ticketCategories" | "status"> & {
  status: string;
  ticketCategories: ReturnType<TicketCategory["toJSON"]>[];
};

export class Event {
  private domainEvents: DomainEvent[] = [];

  constructor(private props: EventProps) {
    if (!props.name.trim()) throw new DomainError("Event name is required");
    if (!props.venue.trim()) throw new DomainError("Event venue is required");
    if (props.endAt <= props.startAt)
      throw new DomainError("Event end time must be after start time");
    if (props.maxCapacity <= 0)
      throw new DomainError("Event capacity must be greater than zero");
  }

  get id() {
    return this.props.id;
  }

  get status() {
    return this.props.status;
  }

  get startAt() {
    return this.props.startAt;
  }

  get ticketCategories() {
    return this.props.ticketCategories;
  }

  get maxCapacity() {
    return this.props.maxCapacity;
  }

  getDomainEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  clearDomainEvents() {
    this.domainEvents = [];
  }

  publish() {
    if (this.props.status !== EventStatus.DRAFT) {
      throw new DomainError("Only draft events can be published");
    }

    const activeCategories = this.props.ticketCategories.filter(
      (c) => c.isActive,
    );
    if (activeCategories.length === 0) {
      throw new DomainError(
        "Event must have at least one active ticket category",
      );
    }

    const totalQuota = this.props.ticketCategories.reduce(
      (sum, c) => sum + c.quota,
      0,
    );
    if (totalQuota > this.props.maxCapacity) {
      throw new DomainError("Total ticket quota exceeds event capacity");
    }

    this.props.status = EventStatus.PUBLISHED;
    this.domainEvents.push(new EventPublished(this.props.id));
  }

  cancel() {
    if (this.props.status === EventStatus.COMPLETED) {
      throw new DomainError("Completed events cannot be cancelled");
    }
    if (this.props.status !== EventStatus.PUBLISHED) {
      throw new DomainError("Only published events can be cancelled");
    }

    this.props.status = EventStatus.CANCELLED;
    this.domainEvents.push(new EventCancelled(this.props.id));
  }

  addTicketCategory(category: TicketCategory) {
    const totalQuota =
      this.props.ticketCategories.reduce((sum, c) => sum + c.quota, 0) +
      category.quota;
    if (totalQuota > this.props.maxCapacity) {
      throw new DomainError("Total ticket quota exceeds event capacity");
    }

    this.props.ticketCategories.push(category);
  }

  reserveTickets(items: Array<{ ticketCategoryId: string; quantity: number }>) {
    if (this.props.status !== EventStatus.PUBLISHED) {
      throw new DomainError("Cannot reserve tickets for non-published event");
    }

    for (const item of items) {
      const category = this.findTicketCategory(item.ticketCategoryId);
      category.reserve(item.quantity);
    }
  }

  releaseTickets(items: Array<{ ticketCategoryId: string; quantity: number }>) {
    for (const item of items) {
      const category = this.findTicketCategory(item.ticketCategoryId);
      category.release(item.quantity);
    }
  }

  releaseQuota(ticketCategoryId: string, quantity: number) {
    const category = this.findTicketCategory(ticketCategoryId);
    category.release(quantity);
  }

  updateName(name: string) {
    if (!name.trim()) throw new DomainError("Event name is required");
    this.props.name = name;
  }

  updateDescription(description: string) {
    this.props.description = description;
  }

  updateVenue(venue: string) {
    if (!venue.trim()) throw new DomainError("Event venue is required");
    this.props.venue = venue;
  }

  updateSchedule(startAt: Date, endAt: Date) {
    if (endAt <= startAt)
      throw new DomainError("Event end time must be after start time");
    this.props.startAt = startAt;
    this.props.endAt = endAt;
  }

  updateMaxCapacity(maxCapacity: number) {
    if (maxCapacity <= 0)
      throw new DomainError("Event capacity must be greater than zero");

    const totalQuota = this.props.ticketCategories.reduce(
      (sum, c) => sum + c.quota,
      0,
    );
    if (totalQuota > maxCapacity) {
      throw new DomainError("Cannot reduce capacity below total ticket quota");
    }

    this.props.maxCapacity = maxCapacity;
  }

  calculateTotal(
    items: Array<{ ticketCategoryId: string; quantity: number }>,
  ): Money {
    let total = new Money(0);
    for (const item of items) {
      const category = this.findTicketCategory(item.ticketCategoryId);
      total = total.add(category.price.multiply(item.quantity));
    }
    return total;
  }

  toJSON(): EventSnapshot {
    return {
      ...this.props,
      status: this.props.status,
      ticketCategories: this.props.ticketCategories.map((c) => c.toJSON()),
    };
  }

  private findTicketCategory(id: string) {
    const category = this.props.ticketCategories.find((c) => c.id === id);
    if (!category)
      throw new DomainError(`Ticket category ${id} does not exist`, 404);
    return category;
  }

  static create(props: Omit<EventProps, "status" | "createdAt">): Event {
    const event = new Event({
      ...props,
      status: EventStatus.DRAFT,
      createdAt: new Date(),
    });
    event.domainEvents.push(new EventCreated(props.id));
    return event;
  }

  static fromPrimitives(
    props: Omit<EventProps, "ticketCategories" | "status"> & {
      ticketCategories: Array<{
        id: string;
        name: string;
        price: number | Money;
        quota: number;
        bookedQuantity: number;
        salesStart: Date | string;
        salesEnd: Date | string;
        isActive: boolean;
      }>;
      status: string;
    },
  ): Event {
    return new Event({
      ...props,
      status: props.status as EventStatus,
      ticketCategories: props.ticketCategories.map((c) =>
        TicketCategory.fromPrimitives(c),
      ),
    });
  }
}
