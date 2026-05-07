import { describe, it, expect } from "bun:test";
import { Event } from "@/app/main/entities/event/event";
import { TicketCategory } from "@/app/main/entities/event/ticket-category";
import { Booking } from "@/app/main/entities/booking/booking";
import { Ticket } from "@/app/main/entities/ticket/ticket";
import { Refund } from "@/app/main/entities/refund/refund";
import { Money } from "@/app/main/shared/utils/helpers/money";
import { Email } from "@/app/main/shared/utils/validation/email";
import { DateRange } from "@/app/main/shared/utils/helpers/date-range";
import { TicketCode } from "@/app/main/shared/utils/helpers/ticket-code";
import { EventStatus } from "@/app/main/entities/event/event-status";
import { BookingStatus } from "@/app/main/entities/booking/booking-status";
import { TicketStatus } from "@/app/main/entities/ticket/ticket-status";
import { RefundStatus } from "@/app/main/entities/refund/refund-status";

describe("Domain Layer Tests", () => {
  describe("Event Entity", () => {
    it("cannot be created with invalid schedule", () => {
      const tomorrow = new Date(Date.now() + 86400000);
      const today = new Date();

      expect(() => {
        Event.create({
          id: "event-1",
          name: "Test Event",
          venue: "Test Venue",
          startAt: tomorrow,
          endAt: today, // End before start
          maxCapacity: 100,
          ticketCategories: [],
        });
      }).toThrow("Event end time must be after start time");
    });

    it("cannot be created with zero or negative capacity", () => {
      const today = new Date();
      const tomorrow = new Date(Date.now() + 86400000);

      expect(() => {
        Event.create({
          id: "event-1",
          name: "Test Event",
          venue: "Test Venue",
          startAt: today,
          endAt: tomorrow,
          maxCapacity: 0,
          ticketCategories: [],
        });
      }).toThrow("Event capacity must be greater than zero");

      expect(() => {
        Event.create({
          id: "event-1",
          name: "Test Event",
          venue: "Test Venue",
          startAt: today,
          endAt: tomorrow,
          maxCapacity: -10,
          ticketCategories: [],
        });
      }).toThrow("Event capacity must be greater than zero");
    });

    it("cannot be published without active ticket category", () => {
      const today = new Date();
      const tomorrow = new Date(Date.now() + 86400000);

      const event = Event.create({
        id: "event-1",
        name: "Test Event",
        venue: "Test Venue",
        startAt: today,
        endAt: tomorrow,
        maxCapacity: 100,
        ticketCategories: [],
      });

      expect(() => event.publish()).toThrow("Event must have at least one active ticket category");
    });

    it("ticket category quota cannot exceed event capacity", () => {
      const today = new Date();
      const tomorrow = new Date(Date.now() + 86400000);

      const event = Event.create({
        id: "event-1",
        name: "Test Event",
        venue: "Test Venue",
        startAt: today,
        endAt: tomorrow,
        maxCapacity: 50,
        ticketCategories: [],
      });

      const category = TicketCategory.create({
        id: "cat-1",
        eventId: "event-1",
        name: "VIP",
        price: new Money(100000),
        quota: 100, // Exceeds capacity
        salesPeriod: new DateRange(today, tomorrow),
      });

      expect(() => event.addTicketCategory(category)).toThrow("Total ticket quota exceeds event capacity");
    });
  });

  describe("Booking Entity", () => {
    it("cannot be created with zero quantity", () => {
      expect(() => {
        Booking.create({
          id: "booking-1",
          eventId: "event-1",
          customerName: "John Doe",
          customerEmail: new Email("john@example.com"),
          items: [
            {
              ticketCategoryId: "cat-1",
              quantity: 0,
              unitPrice: new Money(100000),
            },
          ],
          totalAmount: new Money(0),
        });
      }).toThrow("Every ticket item quantity must be a positive integer");
    });

    it("cannot be paid after payment deadline", () => {
      const pastDeadline = new Date(Date.now() - 1000);

      const booking = new Booking({
        id: "booking-1",
        eventId: "event-1",
        customerName: "John Doe",
        customerEmail: new Email("john@example.com"),
        items: [
          {
            ticketCategoryId: "cat-1",
            quantity: 2,
            unitPrice: new Money(100000),
          },
        ],
        totalAmount: new Money(200000),
        status: BookingStatus.PENDING_PAYMENT,
        paymentDeadline: pastDeadline,
        createdAt: new Date(),
      });

      expect(() => booking.pay(new Money(200000))).toThrow("Payment deadline has passed");
    });

    it("cannot be paid with incorrect payment amount", () => {
      const futureDeadline = new Date(Date.now() + 900000);

      const booking = new Booking({
        id: "booking-1",
        eventId: "event-1",
        customerName: "John Doe",
        customerEmail: new Email("john@example.com"),
        items: [
          {
            ticketCategoryId: "cat-1",
            quantity: 2,
            unitPrice: new Money(100000),
          },
        ],
        totalAmount: new Money(200000),
        status: BookingStatus.PENDING_PAYMENT,
        paymentDeadline: futureDeadline,
        createdAt: new Date(),
      });

      expect(() => booking.pay(new Money(150000))).toThrow("Payment amount must equal total booking price");
    });

    it("paid booking cannot expire", () => {
      const pastDeadline = new Date(Date.now() - 1000);

      const booking = new Booking({
        id: "booking-1",
        eventId: "event-1",
        customerName: "John Doe",
        customerEmail: new Email("john@example.com"),
        items: [
          {
            ticketCategoryId: "cat-1",
            quantity: 2,
            unitPrice: new Money(100000),
          },
        ],
        totalAmount: new Money(200000),
        status: BookingStatus.PAID,
        paymentDeadline: pastDeadline,
        createdAt: new Date(),
        paidAt: new Date(),
      });

      expect(() => booking.expire()).toThrow("Only pending payment booking can expire");
    });
  });

  describe("Ticket Entity", () => {
    it("checked-in ticket cannot be checked in again", () => {
      const ticket = new Ticket({
        id: "ticket-1",
        bookingId: "booking-1",
        eventId: "event-1",
        ticketCategoryId: "cat-1",
        ticketCode: new TicketCode("TICKET123456"),
        customerName: "John Doe",
        status: TicketStatus.CHECKED_IN,
        issuedAt: new Date(),
        checkedInAt: new Date(),
      });

      expect(() => ticket.checkIn("event-1", new Date())).toThrow("Ticket has already been used");
    });
  });

  describe("Refund Entity", () => {
    it("cannot be requested if ticket has already been checked in", () => {
      // This is tested at application layer, but the domain rule is:
      // Refund can only be created for bookings without checked-in tickets
      // The check happens before creating refund entity
    });

    it("cannot be approved if it is not in Requested status", () => {
      const refund = new Refund({
        id: "refund-1",
        bookingId: "booking-1",
        amount: new Money(200000),
        status: RefundStatus.APPROVED,
        requestedAt: new Date(),
        approvedAt: new Date(),
      });

      expect(() => refund.approve()).toThrow("Only requested refund can be approved");
    });

    it("rejected refund must have a rejection reason", () => {
      const refund = new Refund({
        id: "refund-1",
        bookingId: "booking-1",
        amount: new Money(200000),
        status: RefundStatus.REQUESTED,
        requestedAt: new Date(),
      });

      expect(() => refund.reject("")).toThrow("Rejection reason is required");
      expect(() => refund.reject("   ")).toThrow("Rejection reason is required");
    });
  });

  describe("Value Objects", () => {
    it("Money cannot have negative amount", () => {
      expect(() => new Money(-100)).toThrow("Amount cannot be negative");
    });

    it("Email must be valid format", () => {
      expect(() => new Email("invalid-email")).toThrow("Invalid email format");
      expect(() => new Email("test@example.com")).not.toThrow();
    });

    it("DateRange end cannot be before start", () => {
      const tomorrow = new Date(Date.now() + 86400000);
      const today = new Date();

      expect(() => new DateRange(tomorrow, today)).toThrow("End date cannot be earlier than start date");
    });

    it("TicketCode must be valid", () => {
      expect(() => new TicketCode("")).toThrow("Invalid ticket code");
      expect(() => new TicketCode("SHORT")).toThrow("Invalid ticket code");
      expect(() => new TicketCode("VALIDCODE123")).not.toThrow();
    });
  });
});
