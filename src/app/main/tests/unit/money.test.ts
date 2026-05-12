import { describe, expect, it } from "bun:test";
import { Money } from "../../shared/utils/helpers/money";

describe("Money", () => {
  it("creates a Money value object with default IDR currency", () => {
    const m = new Money(100_000);
    expect(m.amount).toBe(100_000);
    expect(m.currency).toBe("IDR");
  });

  it("throws when amount is negative", () => {
    expect(() => new Money(-1)).toThrow("Amount cannot be negative");
  });

  it("adds two Money values of the same currency", () => {
    const a = new Money(100_000);
    const b = new Money(50_000);
    expect(a.add(b).amount).toBe(150_000);
  });

  it("throws when adding Money with different currencies", () => {
    const idr = new Money(100_000, "IDR");
    const usd = new Money(10, "USD");
    expect(() => idr.add(usd)).toThrow("Currency mismatch");
  });

  it("multiplies by a factor", () => {
    const m = new Money(50_000);
    expect(m.multiply(3).amount).toBe(150_000);
  });

  it("checks equality", () => {
    expect(new Money(100_000).equals(new Money(100_000))).toBe(true);
    expect(new Money(100_000).equals(new Money(200_000))).toBe(false);
    expect(new Money(100_000, "IDR").equals(new Money(100_000, "USD"))).toBe(false);
  });
});
