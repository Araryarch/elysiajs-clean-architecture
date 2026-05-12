import { describe, expect, it } from "bun:test";
import { Ticket } from "../../entities/ticket/ticket";
import { TicketStatus } from "../../entities/ticket/ticket-status";
import { TicketCode } from "../../shared/utils/helpers/ticket-code";
import { makeTicket, future } from "../helpers/test-factory";

describe("Ticket entity", () => {
  it("creates a ticket via static create with generated code", () => {
    const ticket = Ticket.create({
      id: "ticket-1",
      bookingId: "booking-1",
      eventId: "event-1",
      ticketCategoryId: "cat-1",
      customerName: "Budi",
    });
    expect(ticket.status).toBe(TicketStatus.ACTIVE);
    expect(ticket.ticketCode.value).toHaveLength(12);
  });

  it("checks in an active ticket", () => {
    const ticket = makeTicket();
    ticket.checkIn("event_test-1", future(10), future(10, 1));
    expect(ticket.status).toBe(TicketStatus.CHECKED_IN);
  });

  it("emits TicketCheckedIn domain event on check-in", () => {
    const ticket = makeTicket();
    ticket.checkIn("event_test-1", future(10), future(10, 1));
    const events = ticket.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]!.eventType).toBe("TicketCheckedIn");
  });

  it("throws when checking in already checked-in ticket", () => {
    const ticket = makeTicket({ status: TicketStatus.CHECKED_IN, checkedInAt: new Date() });
    expect(() => ticket.checkIn("event_test-1", new Date())).toThrow("Ticket has already been used");
  });

  it("throws when checking in cancelled ticket", () => {
    const ticket = makeTicket({ status: TicketStatus.CANCELLED });
    expect(() => ticket.checkIn("event_test-1", new Date())).toThrow("Ticket has been cancelled");
  });

  it("throws when checking in non-active ticket", () => {
    const ticket = makeTicket({ status: TicketStatus.REFUND_REQUIRED });
    expect(() => ticket.checkIn("event_test-1", new Date())).toThrow("Ticket is not active");
  });

  it("throws when checking in with wrong event", () => {
    const ticket = makeTicket({ eventId: "event-other" });
    expect(() => ticket.checkIn("event_test-1", new Date())).toThrow("Ticket does not match the event");
  });

  it("throws when checking in before event date", () => {
    const ticket = makeTicket();
    expect(() => ticket.checkIn("event_test-1", future(10), future(5))).toThrow("Check-in is not yet allowed");
  });

  it("cancels an active ticket", () => {
    const ticket = makeTicket();
    ticket.cancel();
    expect(ticket.status).toBe(TicketStatus.CANCELLED);
  });

  it("throws when cancelling checked-in ticket", () => {
    const ticket = makeTicket({ status: TicketStatus.CHECKED_IN, checkedInAt: new Date() });
    expect(() => ticket.cancel()).toThrow("Cannot cancel checked-in ticket");
  });

  it("marks active ticket as refund required", () => {
    const ticket = makeTicket();
    ticket.markAsRefundRequired();
    expect(ticket.status).toBe(TicketStatus.REFUND_REQUIRED);
  });

  it("does not change non-active ticket when marking refund required", () => {
    const ticket = makeTicket({ status: TicketStatus.CANCELLED });
    ticket.markAsRefundRequired();
    expect(ticket.status).toBe(TicketStatus.CANCELLED);
  });

  it("serializes to JSON", () => {
    const ticket = makeTicket({ id: "ticket-json-1" });
    const json = ticket.toJSON();
    expect(json.id).toBe("ticket-json-1");
    expect(json.ticketCode).toBe("TICKET123456");
    expect(json.status).toBe(TicketStatus.ACTIVE);
  });

  it("clears domain events", () => {
    const ticket = makeTicket();
    ticket.checkIn("event_test-1", future(10), future(10, 1));
    expect(ticket.getDomainEvents()).toHaveLength(1);
    ticket.clearDomainEvents();
    expect(ticket.getDomainEvents()).toHaveLength(0);
  });

  it("restores from primitives", () => {
    const ticket = Ticket.fromPrimitives({
      id: "ticket-restore-1",
      bookingId: "booking-1",
      eventId: "event-1",
      ticketCategoryId: "cat-1",
      ticketCode: "RESTORED123",
      customerName: "Budi",
      status: TicketStatus.ACTIVE,
      issuedAt: new Date("2026-01-01"),
    });
    expect(ticket.id).toBe("ticket-restore-1");
    expect(ticket.ticketCode.value).toBe("RESTORED123");
  });
});
