import { eq, and } from "drizzle-orm";
import { db } from "@/infrastructure/database/connection";
import { promoCodes } from "@/infrastructure/database/schema";
import { PromoCode } from "@/domain/entities/promo-code";
import { IPromoCodeRepository } from "@/domain/repositories/promo-code-repository";

export class PostgresPromoCodeRepository implements IPromoCodeRepository {
  async save(promoCode: PromoCode): Promise<void> {
    const json = promoCode.toJSON();

    await db
      .insert(promoCodes)
      .values({
        id: json.id,
        eventId: json.eventId,
        code: json.code,
        type: json.type,
        discountValue: json.discountValue.toString(),
        maxUsage: json.maxUsage,
        usedCount: json.usedCount,
        validStart: json.validPeriod.start,
        validEnd: json.validPeriod.end,
        minPurchaseAmount: json.minPurchaseAmount?.toString(),
        currency: json.currency || "IDR",
        status: json.status,
        createdAt: json.createdAt,
      })
      .onConflictDoUpdate({
        target: promoCodes.id,
        set: {
          code: json.code,
          type: json.type,
          discountValue: json.discountValue.toString(),
          maxUsage: json.maxUsage,
          usedCount: json.usedCount,
          validStart: json.validPeriod.start,
          validEnd: json.validPeriod.end,
          minPurchaseAmount: json.minPurchaseAmount?.toString(),
          status: json.status,
        },
      });
  }

  async findById(id: string): Promise<PromoCode | null> {
    const result = await db.select().from(promoCodes).where(eq(promoCodes.id, id)).limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0]!;
    return PromoCode.fromPrimitives({
      id: row.id,
      eventId: row.eventId,
      code: row.code,
      type: row.type,
      discountValue: parseFloat(row.discountValue),
      maxUsage: row.maxUsage,
      usedCount: row.usedCount,
      validStart: row.validStart,
      validEnd: row.validEnd,
      minPurchaseAmount: row.minPurchaseAmount ? parseFloat(row.minPurchaseAmount) : null,
      currency: row.currency,
      status: row.status,
      createdAt: row.createdAt,
    });
  }

  async findByCode(eventId: string, code: string): Promise<PromoCode | null> {
    const result = await db
      .select()
      .from(promoCodes)
      .where(and(eq(promoCodes.eventId, eventId), eq(promoCodes.code, code)))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0]!;
    return PromoCode.fromPrimitives({
      id: row.id,
      eventId: row.eventId,
      code: row.code,
      type: row.type,
      discountValue: parseFloat(row.discountValue),
      maxUsage: row.maxUsage,
      usedCount: row.usedCount,
      validStart: row.validStart,
      validEnd: row.validEnd,
      minPurchaseAmount: row.minPurchaseAmount ? parseFloat(row.minPurchaseAmount) : null,
      currency: row.currency,
      status: row.status,
      createdAt: row.createdAt,
    });
  }

  async findByEventId(eventId: string): Promise<PromoCode[]> {
    const results = await db.select().from(promoCodes).where(eq(promoCodes.eventId, eventId));

    return results.map((row) =>
      PromoCode.fromPrimitives({
        id: row.id,
        eventId: row.eventId,
        code: row.code,
        type: row.type,
        discountValue: parseFloat(row.discountValue),
        maxUsage: row.maxUsage,
        usedCount: row.usedCount,
        validStart: row.validStart,
        validEnd: row.validEnd,
        minPurchaseAmount: row.minPurchaseAmount ? parseFloat(row.minPurchaseAmount) : null,
        currency: row.currency,
        status: row.status,
        createdAt: row.createdAt,
      })
    );
  }

  async findAll(): Promise<PromoCode[]> {
    const results = await db.select().from(promoCodes);

    return results.map((row) =>
      PromoCode.fromPrimitives({
        id: row.id,
        eventId: row.eventId,
        code: row.code,
        type: row.type,
        discountValue: parseFloat(row.discountValue),
        maxUsage: row.maxUsage,
        usedCount: row.usedCount,
        validStart: row.validStart,
        validEnd: row.validEnd,
        minPurchaseAmount: row.minPurchaseAmount ? parseFloat(row.minPurchaseAmount) : null,
        currency: row.currency,
        status: row.status,
        createdAt: row.createdAt,
      })
    );
  }

  async delete(id: string): Promise<void> {
    await db.delete(promoCodes).where(eq(promoCodes.id, id));
  }
}
