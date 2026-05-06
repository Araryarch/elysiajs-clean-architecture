import { DomainError } from "@/domain/errors/domain-error";
import { DomainEvent } from "@/domain/events/domain-event";
import { TicketCategoryCreated, TicketCategoryDisabled } from "@/domain/events/events";
import { DateRange } from "@/domain/value-objects/date-range";
import { Money } from "@/domain/value-objects/money";

export type TicketCategoryProps = {
  id: string;
  eventId: string;
  name: string;
  price: Money;
  quota: number;
  bookedQuantity: number;
  salesPeriod: DateRange;
  isActive: boolean;
};

export class TicketCategory {
  private domainEvents: DomainEvent[] = [];

  constructor(private props: TicketCategoryProps) {
    if (props.price.amount < 0) throw new DomainError("Ticket price cannot be negative");
    if (props.quota <= 0) throw new DomainError("Ticket quota must be greater than zero");
    if (props.bookedQuantity < 0 || props.bookedQuantity > props.quota) {
      throw new DomainError("Booked quantity is outside ticket quota");
    }
  }

  get id() {
    return this.props.id;
  }

  get name() {
    return this.props.name;
  }

  get price() {
    return this.props.price;
  }

  get quota() {
    return this.props.quota;
  }

  get bookedQuantity() {
    return this.props.bookedQuantity;
  }

  get availableQuantity() {
    return this.props.quota - this.props.bookedQuantity;
  }

  get isActive() {
    return this.props.isActive;
  }

  get salesPeriod() {
    return this.props.salesPeriod;
  }

  getDomainEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  clearDomainEvents() {
    this.domainEvents = [];
  }

  canBePurchased(now: Date = new Date()): boolean {
    return this.props.isActive && this.props.salesPeriod.isActive(now) && this.availableQuantity > 0;
  }

  disable() {
    if (!this.props.isActive) throw new DomainError("Ticket category is already disabled");
    this.props.isActive = false;
    this.domainEvents.push(new TicketCategoryDisabled(this.props.eventId, this.props.id));
  }

  reserve(quantity: number) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new DomainError("Ticket quantity must be a positive integer");
    }
    if (!this.props.isActive) {
      throw new DomainError("Cannot reserve tickets from inactive category");
    }
    if (quantity > this.availableQuantity) {
      throw new DomainError(`Only ${this.availableQuantity} ${this.name} tickets available`, 409);
    }
    this.props.bookedQuantity += quantity;
  }

  release(quantity: number) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new DomainError("Ticket quantity must be a positive integer");
    }
    this.props.bookedQuantity = Math.max(0, this.props.bookedQuantity - quantity);
  }

  toJSON() {
    return {
      id: this.props.id,
      eventId: this.props.eventId,
      name: this.props.name,
      price: this.props.price.amount,
      currency: this.props.price.currency,
      quota: this.props.quota,
      bookedQuantity: this.props.bookedQuantity,
      availableQuantity: this.availableQuantity,
      salesStart: this.props.salesPeriod.start,
      salesEnd: this.props.salesPeriod.end,
      isActive: this.props.isActive,
    };
  }

  static create(props: Omit<TicketCategoryProps, "bookedQuantity" | "isActive">): TicketCategory {
    const category = new TicketCategory({
      ...props,
      bookedQuantity: 0,
      isActive: true,
    });
    category.domainEvents.push(new TicketCategoryCreated(props.eventId, props.id));
    return category;
  }

  static fromPrimitives(data: any): TicketCategory {
    // Handle both Money object and primitive number for price
    const price = data.price instanceof Money 
      ? data.price 
      : new Money(typeof data.price === 'number' ? data.price : parseFloat(data.price), data.currency || "IDR");
    
    // Handle both DateRange object and primitive dates for salesPeriod
    const salesPeriod = data.salesPeriod instanceof DateRange
      ? data.salesPeriod
      : new DateRange(
          new Date(data.salesStart || data.salesPeriod?.start),
          new Date(data.salesEnd || data.salesPeriod?.end)
        );

    return new TicketCategory({
      id: data.id,
      eventId: data.eventId,
      name: data.name,
      price,
      quota: data.quota,
      bookedQuantity: data.bookedQuantity,
      salesPeriod,
      isActive: data.isActive,
    });
  }
}
