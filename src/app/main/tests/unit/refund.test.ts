import { describe, expect, it } from "bun:test";
import { Refund } from "../../entities/refund/refund";
import { RefundStatus } from "../../entities/refund/refund-status";
import { Money } from "../../domain/value-objects/money";
import { makeRefund } from "../helpers/test-factory";

describe("Refund entity", () => {
  it("creates a refund in Requested status", () => {
    const refund = Refund.create({
      id: "refund-1",
      bookingId: "booking-1",
      amount: new Money(200_000),
    });
    expect(refund.status).toBe(RefundStatus.REQUESTED);
  });

  it("emits RefundRequested domain event on creation", () => {
    const refund = Refund.create({
      id: "refund-1",
      bookingId: "booking-1",
      amount: new Money(200_000),
    });
    const events = refund.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]!.eventType).toBe("RefundRequested");
  });

  it("approves a requested refund", () => {
    const refund = makeRefund();
    refund.approve();
    expect(refund.status).toBe(RefundStatus.APPROVED);
  });

  it("emits RefundApproved on approval", () => {
    const refund = makeRefund();
    refund.clearDomainEvents();
    refund.approve();
    const events = refund.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]!.eventType).toBe("RefundApproved");
  });

  it("throws when approving non-requested refund", () => {
    const refund = makeRefund({ status: RefundStatus.APPROVED });
    expect(() => refund.approve()).toThrow("Only requested refund can be approved");
  });

  it("rejects a requested refund with reason", () => {
    const refund = makeRefund();
    refund.reject("Customer changed mind");
    expect(refund.status).toBe(RefundStatus.REJECTED);
  });

  it("emits RefundRejected on rejection", () => {
    const refund = makeRefund();
    refund.clearDomainEvents();
    refund.reject("Reason");
    const events = refund.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]!.eventType).toBe("RefundRejected");
  });

  it("throws when rejecting without a reason", () => {
    const refund = makeRefund();
    expect(() => refund.reject("")).toThrow("Rejection reason is required");
    expect(() => refund.reject("   ")).toThrow("Rejection reason is required");
  });

  it("throws when rejecting non-requested refund", () => {
    const refund = makeRefund({ status: RefundStatus.APPROVED });
    expect(() => refund.reject("Reason")).toThrow("Only requested refund can be rejected");
  });

  it("marks approved refund as paid out", () => {
    const refund = makeRefund({ status: RefundStatus.APPROVED, approvedAt: new Date() });
    refund.markAsPaidOut("PAY-REF-001");
    expect(refund.status).toBe(RefundStatus.PAID_OUT);
  });

  it("emits RefundPaidOut on payout", () => {
    const refund = makeRefund({ status: RefundStatus.APPROVED, approvedAt: new Date() });
    refund.clearDomainEvents();
    refund.markAsPaidOut("PAY-001");
    const events = refund.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]!.eventType).toBe("RefundPaidOut");
  });

  it("throws when paying out non-approved refund", () => {
    const refund = makeRefund({ status: RefundStatus.REQUESTED });
    expect(() => refund.markAsPaidOut("PAY-REF-001")).toThrow("Only approved refund can be paid out");
  });

  it("throws when paying out without payment reference", () => {
    const refund = makeRefund({ status: RefundStatus.APPROVED, approvedAt: new Date() });
    expect(() => refund.markAsPaidOut("")).toThrow("Payment reference is required");
  });

  it("serializes to JSON", () => {
    const refund = makeRefund({ id: "refund-json-1" });
    const json = refund.toJSON();
    expect(json.id).toBe("refund-json-1");
    expect(json.status).toBe(RefundStatus.REQUESTED);
  });

  it("restores from primitives", () => {
    const refund = Refund.fromPrimitives({
      id: "refund-restore-1",
      bookingId: "booking-1",
      amount: 200_000,
      currency: "IDR",
      status: RefundStatus.APPROVED,
      requestedAt: new Date("2026-01-01"),
      approvedAt: new Date("2026-01-02"),
    });
    expect(refund.id).toBe("refund-restore-1");
    expect(refund.status).toBe(RefundStatus.APPROVED);
  });
});

