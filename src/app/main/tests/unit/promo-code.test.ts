import { describe, expect, it } from "bun:test";
import { PromoCode, PromoCodeType, PromoCodeStatus } from "../../entities/promo-code/promo-code";
import { Money } from "../../domain/value-objects/money";
import { DateRange } from "../../domain/value-objects/date-range";
import { makePromoCode, past, future } from "../helpers/test-factory";

describe("PromoCode entity", () => {
  it("creates a promo code with Active status", () => {
    const pc = makePromoCode();
    expect(pc.status).toBe(PromoCodeStatus.ACTIVE);
    expect(pc.usedCount).toBe(0);
  });

  it("throws when percentage discount is outside 0-100", () => {
    expect(() => makePromoCode({ discountValue: 150 })).toThrow("Percentage discount must be between 0 and 100");
    expect(() => makePromoCode({ discountValue: -10 })).toThrow("Percentage discount must be between 0 and 100");
  });

  it("throws when fixed amount discount is negative", () => {
    expect(() => makePromoCode({ type: PromoCodeType.FIXED_AMOUNT, discountValue: -50 }))
      .toThrow("Fixed amount discount must be positive");
  });

  it("throws when max usage is less than 1", () => {
    expect(() => makePromoCode({ maxUsage: 0 })).toThrow("Max usage must be at least 1");
  });

  it("can be used when active and within valid period", () => {
    const pc = makePromoCode();
    expect(pc.canBeUsed()).toBe(true);
  });

  it("cannot be used when inactive", () => {
    const pc = makePromoCode();
    pc.deactivate();
    expect(pc.canBeUsed()).toBe(false);
  });

  it("cannot be used when max usage reached", () => {
    const pc = makePromoCode({ maxUsage: 2 });
    pc.incrementUsage();
    pc.incrementUsage();
    expect(pc.canBeUsed()).toBe(false);
  });

  it("cannot be used when outside valid period", () => {
    const pc = makePromoCode({ validPeriod: new DateRange(past(10), past(1)) });
    expect(pc.canBeUsed()).toBe(false);
  });

  it("validates minimum purchase amount", () => {
    const pc = makePromoCode({ minPurchaseAmount: new Money(100_000) });
    expect(pc.validateMinPurchase(new Money(200_000))).toBe(true);
    expect(pc.validateMinPurchase(new Money(50_000))).toBe(false);
  });

  it("validates minimum purchase as true when not set", () => {
    const pc = makePromoCode();
    expect(pc.validateMinPurchase(new Money(0))).toBe(true);
  });

  it("calculates percentage discount", () => {
    const pc = makePromoCode({ type: PromoCodeType.PERCENTAGE, discountValue: 20 });
    const discount = pc.calculateDiscount(new Money(100_000));
    expect(discount.amount).toBe(20_000);
  });

  it("calculates fixed amount discount", () => {
    const pc = makePromoCode({ type: PromoCodeType.FIXED_AMOUNT, discountValue: 25_000 });
    const discount = pc.calculateDiscount(new Money(100_000));
    expect(discount.amount).toBe(25_000);
  });

  it("caps fixed discount to purchase amount", () => {
    const pc = makePromoCode({ type: PromoCodeType.FIXED_AMOUNT, discountValue: 50_000 });
    const discount = pc.calculateDiscount(new Money(30_000));
    expect(discount.amount).toBe(30_000);
  });

  it("increments usage count", () => {
    const pc = makePromoCode();
    pc.incrementUsage();
    expect(pc.usedCount).toBe(1);
  });

  it("auto-expires when max usage reached", () => {
    const pc = makePromoCode({ maxUsage: 1 });
    pc.incrementUsage();
    expect(pc.status).toBe(PromoCodeStatus.EXPIRED);
  });

  it("throws when incrementing usage on exhausted code", () => {
    const pc = makePromoCode({ maxUsage: 1 });
    pc.incrementUsage();
    expect(() => pc.incrementUsage()).toThrow("Promo code cannot be used");
  });

  it("deactivates an active code", () => {
    const pc = makePromoCode();
    pc.deactivate();
    expect(pc.status).toBe(PromoCodeStatus.INACTIVE);
  });

  it("throws when deactivating expired code", () => {
    const pc = makePromoCode({ maxUsage: 1 });
    pc.incrementUsage();
    expect(() => pc.deactivate()).toThrow("Cannot deactivate expired promo code");
  });

  it("activates an inactive code", () => {
    const pc = makePromoCode();
    pc.deactivate();
    pc.activate();
    expect(pc.status).toBe(PromoCodeStatus.ACTIVE);
  });

  it("serializes to JSON", () => {
    const pc = makePromoCode({ id: "promo-json-1" });
    const json = pc.toJSON();
    expect(json.id).toBe("promo-json-1");
    expect(json.code).toBe("DISKON50");
  });

  it("restores from primitives", () => {
    const pc = PromoCode.fromPrimitives({
      id: "promo-restore-1",
      eventId: "event-1",
      code: "RESTORE",
      type: PromoCodeType.PERCENTAGE,
      discountValue: 10,
      maxUsage: 100,
      usedCount: 5,
      validStart: past(1),
      validEnd: future(30),
      status: PromoCodeStatus.ACTIVE,
      createdAt: new Date(),
    });
    expect(pc.id).toBe("promo-restore-1");
    expect(pc.usedCount).toBe(5);
  });
});

