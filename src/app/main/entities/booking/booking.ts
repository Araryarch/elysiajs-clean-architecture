import { DomainError } from "../../domain/errors/domain-error";
import { DomainEvent } from "../../domain/events/domain-event";
import {
  BookingExpired,
  BookingPaid,
  TicketReserved,
} from "../../domain/events/events";
import { Email } from "../../domain/value-objects/email";
import { Money } from "../../domain/value-objects/money";
import { BookingStatus } from "./booking-status";

export type BookingItem = {
  ticketCategoryId: string;
  quantity: number;
  unitPrice: Money;
};

export type BookingProps = {
  id: string;
  eventId: string;
  customerName: string;
  customerEmail: Email;
  items: BookingItem[];
  totalAmount: Money;
  status: BookingStatus;
  paymentDeadline: Date;
  createdAt: Date;
  paidAt?: Date;
};

export class Booking {
  private domainEvents: DomainEvent[] = [];

  constructor(private props: BookingProps) {
    if (!props.customerName.trim())
      throw new DomainError("Customer name is required");
    if (props.items.length === 0)
      throw new DomainError("Booking must contain at least one ticket item");
    if (
      props.items.some(
        (item) => !Number.isInteger(item.quantity) || item.quantity <= 0,
      )
    ) {
      throw new DomainError(
        "Every ticket item quantity must be a positive integer",
      );
    }
  }

  get id() {
    return this.props.id;
  }

  get eventId() {
    return this.props.eventId;
  }

  get status() {
    return this.props.status;
  }

  get items() {
    return this.props.items;
  }

  get totalAmount() {
    return this.props.totalAmount;
  }

  get paymentDeadline() {
    return this.props.paymentDeadline;
  }

  getDomainEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  clearDomainEvents() {
    this.domainEvents = [];
  }

  pay(amount: Money, now: Date = new Date()) {
    if (this.props.status !== BookingStatus.PENDING_PAYMENT) {
      throw new DomainError("Only pending payment booking can be paid");
    }
    if (now > this.props.paymentDeadline) {
      throw new DomainError("Payment deadline has passed");
    }
    if (!amount.equals(this.props.totalAmount)) {
      throw new DomainError("Payment amount must equal total booking price");
    }

    this.props.status = BookingStatus.PAID;
    this.props.paidAt = now;
    this.domainEvents.push(new BookingPaid(this.props.id, amount.amount));
  }

  expire(now: Date = new Date()) {
    if (this.props.status !== BookingStatus.PENDING_PAYMENT) {
      throw new DomainError("Only pending payment booking can expire");
    }
    if (now <= this.props.paymentDeadline) {
      throw new DomainError("Cannot expire booking before payment deadline");
    }

    this.props.status = BookingStatus.EXPIRED;
    this.domainEvents.push(new BookingExpired(this.props.id));
  }

  markAsRefunded() {
    if (this.props.status !== BookingStatus.PAID) {
      throw new DomainError("Only paid booking can be refunded");
    }
    this.props.status = BookingStatus.REFUNDED;
  }

  toJSON() {
    return {
      id: this.props.id,
      eventId: this.props.eventId,
      customerName: this.props.customerName,
      customerEmail: this.props.customerEmail.value,
      items: this.props.items.map((item) => ({
        ticketCategoryId: item.ticketCategoryId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.amount,
        currency: item.unitPrice.currency,
      })),
      totalAmount: this.props.totalAmount.amount,
      currency: this.props.totalAmount.currency,
      status: this.props.status,
      paymentDeadline: this.props.paymentDeadline,
      createdAt: this.props.createdAt,
      paidAt: this.props.paidAt,
    };
  }

  static create(
    props: Omit<BookingProps, "status" | "createdAt" | "paymentDeadline">,
  ): Booking {
    const now = new Date();
    const paymentDeadline = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes

    const booking = new Booking({
      ...props,
      status: BookingStatus.PENDING_PAYMENT,
      paymentDeadline,
      createdAt: now,
    });

    const totalQuantity = props.items.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    booking.domainEvents.push(
      new TicketReserved(props.id, props.eventId, totalQuantity),
    );

    return booking;
  }

  static fromPrimitives(data: {
    id: string;
    eventId: string;
    customerName: string;
    customerEmail: string;
    items: Array<{
      ticketCategoryId: string;
      quantity: number;
      unitPrice: number;
      currency?: string;
    }>;
    totalAmount: number;
    currency?: string;
    status: string;
    paymentDeadline: Date | string;
    createdAt: Date | string;
    paidAt?: Date | string | null;
  }): Booking {
    return new Booking({
      id: data.id,
      eventId: data.eventId,
      customerName: data.customerName,
      customerEmail: new Email(data.customerEmail),
      items: data.items.map((item) => ({
        ticketCategoryId: item.ticketCategoryId,
        quantity: item.quantity,
        unitPrice: new Money(item.unitPrice, item.currency || "IDR"),
      })),
      totalAmount: new Money(data.totalAmount, data.currency || "IDR"),
      status: data.status as BookingStatus,
      paymentDeadline: new Date(data.paymentDeadline),
      createdAt: new Date(data.createdAt),
      paidAt: data.paidAt ? new Date(data.paidAt) : undefined,
    });
  }
}

