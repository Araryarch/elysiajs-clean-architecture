import { eq } from "drizzle-orm";
import { Refund } from "../../../entities/refund/refund";
import { IRefundRepository } from "./refund-repository";
import { Money } from "../../../domain/value-objects/money";
import { db } from "../../../database/drizzle/index/connection";
import { refunds } from "../../../database/drizzle/schema/schema";

export class PostgresRefundRepository implements IRefundRepository {
  async save(refund: Refund): Promise<void> {
    const json = refund.toJSON();

    await db
      .insert(refunds)
      .values({
        id: json.id,
        bookingId: json.bookingId,
        amount: json.amount.toString(),
        currency: json.currency,
        status: json.status,
        requestedAt: json.requestedAt,
        approvedAt: json.approvedAt,
        rejectedAt: json.rejectedAt,
        paidOutAt: json.paidOutAt,
        rejectionReason: json.rejectionReason,
        paymentReference: json.paymentReference,
      })
      .onConflictDoUpdate({
        target: refunds.id,
        set: {
          status: json.status,
          approvedAt: json.approvedAt,
          rejectedAt: json.rejectedAt,
          paidOutAt: json.paidOutAt,
          rejectionReason: json.rejectionReason,
          paymentReference: json.paymentReference,
        },
      });
  }

  async findById(id: string): Promise<Refund | null> {
    const refundData = await db.query.refunds.findFirst({
      where: eq(refunds.id, id),
    });

    if (!refundData) return null;

    return Refund.fromPrimitives({
      ...refundData,
      amount: parseFloat(refundData.amount),
    });
  }

  async findByBookingId(bookingId: string): Promise<Refund[]> {
    const refundsList = await db.query.refunds.findMany({
      where: eq(refunds.bookingId, bookingId),
    });

    return refundsList.map((r) =>
      Refund.fromPrimitives({
        ...r,
        amount: parseFloat(r.amount),
      }),
    );
  }

  async findAll(): Promise<Refund[]> {
    const refundsList = await db.query.refunds.findMany();
    return refundsList.map((r) =>
      Refund.fromPrimitives({
        ...r,
        amount: parseFloat(r.amount),
      }),
    );
  }
}
