import { describe, expect, it } from "bun:test";
import { DateRange } from "../../domain/value-objects/date-range";
import { TicketCode } from "../../domain/value-objects/ticket-code";
import { Email } from "../../domain/value-objects/email";
import { Money } from "../../domain/value-objects/money";
import { success, error } from "../../middlewares/response/response";
import { future, past } from "../helpers/test-factory";

describe("DateRange", () => {
  it("creates a valid date range", () => {
    const range = new DateRange(future(1), future(10));
    expect(range.start).toBeInstanceOf(Date);
    expect(range.end).toBeInstanceOf(Date);
  });

  it("throws when end is before start", () => {
    expect(() => new DateRange(future(10), future(1))).toThrow("End date cannot be earlier than start date");
  });

  it("contains a date within the range", () => {
    const range = new DateRange(future(1), future(10));
    expect(range.contains(future(5))).toBe(true);
  });

  it("does not contain a date outside the range", () => {
    const range = new DateRange(future(1), future(10));
    expect(range.contains(future(15))).toBe(false);
    expect(range.contains(past(1))).toBe(false);
  });

  it("checks if range is active (includes current time)", () => {
    const range = new DateRange(past(1), future(1));
    expect(range.isActive()).toBe(true);
  });

  it("checks if range is not active when outside", () => {
    const pastRange = new DateRange(past(10), past(1));
    expect(pastRange.isActive()).toBe(false);

    const futureRange = new DateRange(future(10), future(20));
    expect(futureRange.isActive()).toBe(false);
  });
});

describe("TicketCode", () => {
  it("creates a valid ticket code", () => {
    const code = new TicketCode("VALIDCODE123");
    expect(code.value).toBe("VALIDCODE123");
  });

  it("throws for empty code", () => {
    expect(() => new TicketCode("")).toThrow("Invalid ticket code");
  });

  it("throws for short code", () => {
    expect(() => new TicketCode("SHORT")).toThrow("Invalid ticket code");
  });

  it("generates a random code", () => {
    const code = TicketCode.generate();
    expect(code.value).toHaveLength(12);
  });

  it("checks equality", () => {
    const a = new TicketCode("CODE12345678");
    const b = new TicketCode("CODE12345678");
    const c = new TicketCode("OTHER9999999");
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});

describe("Email", () => {
  it("creates a valid email", () => {
    const email = new Email("test@example.com");
    expect(email.value).toBe("test@example.com");
  });

  it("throws for invalid email", () => {
    expect(() => new Email("invalid")).toThrow("Invalid email format");
    expect(() => new Email("")).toThrow("Invalid email format");
    expect(() => new Email("test@")).toThrow("Invalid email format");
  });

  it("checks equality", () => {
    const a = new Email("a@b.com");
    const b = new Email("a@b.com");
    const c = new Email("c@d.com");
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});

describe("Money", () => {
  it("creates money with default IDR", () => {
    const m = new Money(100_000);
    expect(m.amount).toBe(100_000);
    expect(m.currency).toBe("IDR");
  });

  it("throws for negative amount", () => {
    expect(() => new Money(-1)).toThrow("Amount cannot be negative");
  });

  it("creates money with zero", () => {
    const m = new Money(0);
    expect(m.amount).toBe(0);
  });

  it("adds same currency", () => {
    const a = new Money(100_000, "IDR");
    const b = new Money(50_000, "IDR");
    expect(a.add(b).amount).toBe(150_000);
  });

  it("throws when adding different currencies", () => {
    expect(() => new Money(100_000, "IDR").add(new Money(10, "USD"))).toThrow("Currency mismatch");
  });

  it("multiplies", () => {
    const m = new Money(50_000);
    expect(m.multiply(3).amount).toBe(150_000);
  });

  it("handles fractional multiplication", () => {
    const m = new Money(100);
    expect(m.multiply(0.5).amount).toBe(50);
  });

  it("checks equality", () => {
    expect(new Money(100_000).equals(new Money(100_000))).toBe(true);
    expect(new Money(100_000).equals(new Money(200_000))).toBe(false);
    expect(new Money(100_000, "IDR").equals(new Money(100_000, "USD"))).toBe(false);
  });
});

describe("Response helpers", () => {
  it("creates success response", () => {
    const res = success({ id: "1" }, "Created");
    expect(res.success).toBe(true);
    expect(res.message).toBe("Created");
    expect(res.data).toEqual({ id: "1" });
  });

  it("creates success response with default message", () => {
    const res = success("ok");
    expect(res.success).toBe(true);
    expect(res.message).toBe("Success");
  });

  it("creates error response", () => {
    const res = error("Something went wrong", "ERROR_CODE");
    expect(res.success).toBe(false);
    expect(res.message).toBe("Something went wrong");
    expect(res.error?.code).toBe("ERROR_CODE");
  });

  it("creates error response with field and details", () => {
    const res = error("Invalid email", "VALIDATION_ERROR", "email", { format: "email" });
    expect(res.error?.field).toBe("email");
    expect(res.error?.details).toEqual({ format: "email" });
  });
});

describe("DomainError classes", () => {
  it("creates NotFoundError with correct properties", () => {
    const { NotFoundError } = require("../../domain/errors/domain-error");
    const err = new NotFoundError("Event", "evt-1");
    expect(err.message).toBe("Event with id 'evt-1' not found");
    expect(err.statusCode).toBe(404);
    expect(err.name).toBe("NotFoundError");
  });

  it("creates NotFoundError without id", () => {
    const { NotFoundError } = require("../../domain/errors/domain-error");
    const err = new NotFoundError("Event");
    expect(err.message).toBe("Event not found");
  });

  it("creates ValidationError", () => {
    const { ValidationError } = require("../../domain/errors/domain-error");
    const err = new ValidationError("Invalid input", "name");
    expect(err.statusCode).toBe(400);
    expect(err.name).toBe("ValidationError");
  });

  it("creates ConflictError", () => {
    const { ConflictError } = require("../../domain/errors/domain-error");
    const err = new ConflictError("Duplicate");
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe("CONFLICT");
  });

  it("creates UnauthorizedError", () => {
    const { UnauthorizedError } = require("../../domain/errors/domain-error");
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
  });

  it("creates ForbiddenError", () => {
    const { ForbiddenError } = require("../../domain/errors/domain-error");
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
  });
});

