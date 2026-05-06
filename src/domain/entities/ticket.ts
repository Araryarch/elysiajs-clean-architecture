import { DomainError } from "@/domain/errors/domain-error";
import { DomainEvent } from "@/domain/events/domain-event";
import { TicketCheckedIn } from "@/domain/events/events";
import { TicketCode } from "@/domain/value-objects/ticket-code";
import { TicketStatus } from "@/domain/entities/ticket-status";

export type TicketProps = {
  id: string;
  bookingId: string;
  eventId: string;
  ticketCategoryId: string;
  ticketCode: TicketCode;
  customerName: string;
  status: TicketStatus;
  issuedAt: Date;
  checkedInAt?: Date;
};

export class Ticket {
  private domainEvents: DomainEvent[] = [];

  constructor(private props: TicketProps) {}

  get id() {
    return this.props.id;
  }

  get ticketCode() {
    return this.props.ticketCode;
  }

  get status() {
    return this.props.status;
  }

  get eventId() {
    return this.props.eventId;
  }

  getDomainEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  clearDomainEvents() {
    this.domainEvents = [];
  }

  checkIn(eventId: string, eventDate: Date, now: Date = new Date()) {
    if (this.props.eventId !== eventId) {
      throw new DomainError("Ticket does not match the event");
    }
    if (this.props.status === TicketStatus.CHECKED_IN) {
      throw new DomainError("Ticket has already been used");
    }
    if (this.props.status === TicketStatus.CANCELLED) {
      throw new DomainError("Ticket has been cancelled");
    }
    if (this.props.status !== TicketStatus.ACTIVE) {
      throw new DomainError("Ticket is not active");
    }

    // Check if check-in is on event day (simplified: same day)
    const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    const checkInDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (checkInDay < eventDay) {
      throw new DomainError("Check-in is not yet allowed");
    }

    this.props.status = TicketStatus.CHECKED_IN;
    this.props.checkedInAt = now;
    this.domainEvents.push(new TicketCheckedIn(this.props.id, this.props.ticketCode.value));
  }

  cancel() {
    if (this.props.status === TicketStatus.CHECKED_IN) {
      throw new DomainError("Cannot cancel checked-in ticket");
    }
    this.props.status = TicketStatus.CANCELLED;
  }

  markAsRefundRequired() {
    if (this.props.status !== TicketStatus.ACTIVE) {
      return; // Only active tickets need to be marked
    }
    this.props.status = TicketStatus.REFUND_REQUIRED;
  }

  toJSON() {
    return {
      id: this.props.id,
      bookingId: this.props.bookingId,
      eventId: this.props.eventId,
      ticketCategoryId: this.props.ticketCategoryId,
      ticketCode: this.props.ticketCode.value,
      customerName: this.props.customerName,
      status: this.props.status,
      issuedAt: this.props.issuedAt,
      checkedInAt: this.props.checkedInAt,
    };
  }

  static create(props: Omit<TicketProps, "ticketCode" | "status" | "issuedAt">): Ticket {
    return new Ticket({
      ...props,
      ticketCode: TicketCode.generate(),
      status: TicketStatus.ACTIVE,
      issuedAt: new Date(),
    });
  }

  static fromPrimitives(data: any): Ticket {
    return new Ticket({
      id: data.id,
      bookingId: data.bookingId,
      eventId: data.eventId,
      ticketCategoryId: data.ticketCategoryId,
      ticketCode: new TicketCode(data.ticketCode),
      customerName: data.customerName,
      status: data.status as TicketStatus,
      issuedAt: new Date(data.issuedAt),
      checkedInAt: data.checkedInAt ? new Date(data.checkedInAt) : undefined,
    });
  }
}
