import { describe, expect, it } from "bun:test";
import { Booking } from "@/app/main/entities/booking/booking";
import { BookingStatus } from "@/app/main/entities/booking/booking-status";
import { Email } from "@/app/main/shared/utils/validation/email";
import { Money } from "@/app/main/shared/utils/helpers/money";

function makeBooking() {
  return Booking.create({
    id: "booking_test-1",
    eventId: "event_test-1",
    customerName: "Budi Santoso",
    customerEmail: new Email("budi@example.com"),
    items: [
      {
        ticketCategoryId: "cat_test-1",
        quantity: 2,
        unitPrice: new Money(100_000),
      },
    ],
    totalAmount: new Money(200_000),
  });
}

describe("Booking entity", () => {
  it("creates a booking in PendingPayment status", () => {
    const booking = makeBooking();
    expect(booking.status).toBe(BookingStatus.PENDING_PAYMENT);
  });

  it("emits TicketReserved domain event on creation", () => {
    const booking = makeBooking();
    const events = booking.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]!.eventType).toBe("TicketReserved");
  });

  it("pays a booking with the correct amount", () => {
    const booking = makeBooking();
    // Backdate the deadline so we can pay immediately
    (booking as any).props.paymentDeadline = new Date(Date.now() + 60_000);
    booking.pay(new Money(200_000));
    expect(booking.status).toBe(BookingStatus.PAID);
  });

  it("throws when paying with wrong amount", () => {
    const booking = makeBooking();
    expect(() => booking.pay(new Money(100_000))).toThrow(
      "Payment amount must equal total booking price",
    );
  });

  it("expires a booking past its deadline", () => {
    const booking = makeBooking();
    // Backdate the deadline to the past
    (booking as any).props.paymentDeadline = new Date(Date.now() - 1);
    booking.expire(new Date());
    expect(booking.status).toBe(BookingStatus.EXPIRED);
  });

  it("throws when expiring before deadline", () => {
    const booking = makeBooking();
    expect(() => booking.expire(new Date())).toThrow(
      "Cannot expire booking before payment deadline",
    );
  });

  it("marks a paid booking as refunded", () => {
    const booking = makeBooking();
    (booking as any).props.paymentDeadline = new Date(Date.now() + 60_000);
    booking.pay(new Money(200_000));
    booking.markAsRefunded();
    expect(booking.status).toBe(BookingStatus.REFUNDED);
  });
});
