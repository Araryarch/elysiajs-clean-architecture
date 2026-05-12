import { Event } from "../../entities/event/event";
import { TicketCategory } from "../../entities/event/ticket-category";
import { Booking } from "../../entities/booking/booking";
import { Ticket } from "../../entities/ticket/ticket";
import { Refund } from "../../entities/refund/refund";
import { PromoCode, PromoCodeType, PromoCodeStatus } from "../../entities/promo-code/promo-code";
import { User, UserRole } from "../../entities/auth/user";
import { Money } from "../../domain/value-objects/money";
import { Email } from "../../domain/value-objects/email";
import { DateRange } from "../../domain/value-objects/date-range";
import { TicketCode } from "../../domain/value-objects/ticket-code";
import { TicketStatus } from "../../entities/ticket/ticket-status";
import { BookingStatus } from "../../entities/booking/booking-status";
import { RefundStatus } from "../../entities/refund/refund-status";
import { EventStatus } from "../../entities/event/event-status";

export const future = (days: number, hours = 0): Date =>
  new Date(Date.now() + days * 86_400_000 + hours * 3_600_000);

export const past = (days: number): Date =>
  new Date(Date.now() - days * 86_400_000);

export function makeEvent(overrides: Partial<Parameters<typeof Event.create>[0]> = {}): Event {
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

export function makePublishedEvent(id = "event_pub-1"): Event {
  const event = makeEvent({ id, name: `Published Event ${id}` });
  const cat = makeCategory(event.id, { salesPeriod: new DateRange(past(1), future(9)) });
  event.addTicketCategory(cat);
  event.publish();
  event.clearDomainEvents();
  return event;
}

export function makeCategory(eventId: string, overrides: Partial<Parameters<typeof TicketCategory.create>[0]> = {}): TicketCategory {
  return TicketCategory.create({
    id: "cat_test-1",
    eventId,
    name: "Regular",
    price: new Money(100_000),
    quota: 50,
    salesPeriod: new DateRange(future(1), future(9)),
    ...overrides,
  });
}

export function makeBooking(overrides: Partial<{
  id: string;
  eventId: string;
  customerName: string;
  customerEmail: string;
  items: Array<{ ticketCategoryId: string; quantity: number; unitPrice: Money }>;
  totalAmount: Money;
}> = {}): Booking {
  const email = overrides.customerEmail ?? "budi@example.com";
  const items = overrides.items ?? [
    { ticketCategoryId: "cat_test-1", quantity: 2, unitPrice: new Money(100_000) },
  ];
  const { customerEmail: _ce, items: _it, ...rest } = overrides;
  return Booking.create({
    id: "booking_test-1",
    eventId: "event_test-1",
    customerName: "Budi Santoso",
    customerEmail: new Email(email),
    items,
    totalAmount: new Money(200_000),
    ...rest,
  });
}

export function makePaidBooking(eventId = "event_test-1"): Booking {
  const booking = makeBooking({ eventId });
  (booking as any).props.paymentDeadline = future(0, 1);
  booking.pay(new Money(200_000));
  return booking;
}

export function makeTicket(overrides: Partial<{
  id: string;
  bookingId: string;
  eventId: string;
  ticketCategoryId: string;
  ticketCode: TicketCode;
  customerName: string;
  status: TicketStatus;
  issuedAt: Date;
  checkedInAt: Date;
}> = {}): Ticket {
  return new Ticket({
    id: "ticket_test-1",
    bookingId: "booking_test-1",
    eventId: "event_test-1",
    ticketCategoryId: "cat_test-1",
    ticketCode: new TicketCode("TICKET123456"),
    customerName: "Budi Santoso",
    status: TicketStatus.ACTIVE,
    issuedAt: new Date(),
    ...overrides,
  });
}

export function makeRefund(overrides: Partial<{
  id: string;
  bookingId: string;
  amount: Money;
  status: RefundStatus;
  requestedAt: Date;
  approvedAt: Date;
  rejectedAt: Date;
  paidOutAt: Date;
  rejectionReason: string;
  paymentReference: string;
}> = {}): Refund {
  return new Refund({
    id: "refund_test-1",
    bookingId: "booking_test-1",
    amount: new Money(200_000),
    status: RefundStatus.REQUESTED,
    requestedAt: new Date(),
    ...overrides,
  });
}

export function makePromoCode(overrides: Partial<Parameters<typeof PromoCode.create>[0]> = {}): PromoCode {
  return PromoCode.create({
    id: "promo_test-1",
    eventId: "event_test-1",
    code: "DISKON50",
    type: PromoCodeType.PERCENTAGE,
    discountValue: 50,
    maxUsage: 100,
    validPeriod: new DateRange(past(1), future(30)),
    ...overrides,
  });
}

export async function makeUser(overrides: Partial<{
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
}> = {}): Promise<User> {
  return User.create({
    id: "user_test-1",
    email: "user@example.com",
    password: "password123",
    name: "Test User",
    role: UserRole.CUSTOMER,
    ...overrides,
  });
}

