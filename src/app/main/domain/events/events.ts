import { DomainEvent } from "./domain-event";

export class EventCreated implements DomainEvent {
  eventType = "EventCreated";
  occurredAt = new Date();
  constructor(public eventId: string) {}
}

export class EventPublished implements DomainEvent {
  eventType = "EventPublished";
  occurredAt = new Date();
  constructor(public eventId: string) {}
}

export class EventCancelled implements DomainEvent {
  eventType = "EventCancelled";
  occurredAt = new Date();
  constructor(public eventId: string) {}
}

export class TicketCategoryCreated implements DomainEvent {
  eventType = "TicketCategoryCreated";
  occurredAt = new Date();
  constructor(
    public eventId: string,
    public categoryId: string,
  ) {}
}

export class TicketCategoryDisabled implements DomainEvent {
  eventType = "TicketCategoryDisabled";
  occurredAt = new Date();
  constructor(
    public eventId: string,
    public categoryId: string,
  ) {}
}

export class TicketReserved implements DomainEvent {
  eventType = "TicketReserved";
  occurredAt = new Date();
  constructor(
    public bookingId: string,
    public eventId: string,
    public quantity: number,
  ) {}
}

export class BookingPaid implements DomainEvent {
  eventType = "BookingPaid";
  occurredAt = new Date();
  constructor(
    public bookingId: string,
    public amount: number,
  ) {}
}

export class BookingExpired implements DomainEvent {
  eventType = "BookingExpired";
  occurredAt = new Date();
  constructor(public bookingId: string) {}
}

export class TicketCheckedIn implements DomainEvent {
  eventType = "TicketCheckedIn";
  occurredAt = new Date();
  constructor(
    public ticketId: string,
    public ticketCode: string,
  ) {}
}

export class RefundRequested implements DomainEvent {
  eventType = "RefundRequested";
  occurredAt = new Date();
  constructor(
    public refundId: string,
    public bookingId: string,
  ) {}
}

export class RefundApproved implements DomainEvent {
  eventType = "RefundApproved";
  occurredAt = new Date();
  constructor(public refundId: string) {}
}

export class RefundRejected implements DomainEvent {
  eventType = "RefundRejected";
  occurredAt = new Date();
  constructor(
    public refundId: string,
    public reason: string,
  ) {}
}

export class RefundPaidOut implements DomainEvent {
  eventType = "RefundPaidOut";
  occurredAt = new Date();
  constructor(
    public refundId: string,
    public paymentReference: string,
  ) {}
}
