import { eq, and } from "drizzle-orm";
import { Booking } from "@/domain/entities/booking";
import { BookingRepository } from "@/domain/repositories/booking-repository";
import { Email } from "@/domain/value-objects/email";
import { Money } from "@/domain/value-objects/money";
import { db } from "@/infrastructure/database/connection";
import { bookings, bookingItems } from "@/infrastructure/database/schema";
import { createId } from "@/shared/id";

export class PostgresBookingRepository implements BookingRepository {
  async save(booking: Booking): Promise<void> {
    const json = booking.toJSON();

    await db.transaction(async (tx) => {
      // Upsert booking
      await tx
        .insert(bookings)
        .values({
          id: json.id,
          eventId: json.eventId,
          customerName: json.customerName,
          customerEmail: json.customerEmail,
          totalAmount: json.totalAmount.toString(),
          currency: json.currency,
          status: json.status,
          paymentDeadline: json.paymentDeadline,
          createdAt: json.createdAt,
          paidAt: json.paidAt,
        })
        .onConflictDoUpdate({
          target: bookings.id,
          set: {
            status: json.status,
            paidAt: json.paidAt,
          },
        });

      // Delete existing items and insert new ones
      await tx.delete(bookingItems).where(eq(bookingItems.bookingId, json.id));

      for (const item of json.items) {
        await tx.insert(bookingItems).values({
          id: createId("booking_item"),
          bookingId: json.id,
          ticketCategoryId: item.ticketCategoryId,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          currency: item.currency,
        });
      }
    });
  }

  async findById(id: string): Promise<Booking | null> {
    const bookingData = await db.query.bookings.findFirst({
      where: eq(bookings.id, id),
    });

    if (!bookingData) return null;

    const items = await db.query.bookingItems.findMany({
      where: eq(bookingItems.bookingId, id),
    });

    return Booking.fromPrimitives({
      ...bookingData,
      items: items.map((item) => ({
        ticketCategoryId: item.ticketCategoryId,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice),
        currency: item.currency,
      })),
      totalAmount: parseFloat(bookingData.totalAmount),
    });
  }

  async findByEventId(eventId: string): Promise<Booking[]> {
    const bookingsList = await db.query.bookings.findMany({
      where: eq(bookings.eventId, eventId),
    });

    const result: Booking[] = [];

    for (const bookingData of bookingsList) {
      const items = await db.query.bookingItems.findMany({
        where: eq(bookingItems.bookingId, bookingData.id),
      });

      result.push(
        Booking.fromPrimitives({
          ...bookingData,
          items: items.map((item) => ({
            ticketCategoryId: item.ticketCategoryId,
            quantity: item.quantity,
            unitPrice: parseFloat(item.unitPrice),
            currency: item.currency,
          })),
          totalAmount: parseFloat(bookingData.totalAmount),
        })
      );
    }

    return result;
  }

  async findByEventAndCustomer(eventId: string, customerEmail: string): Promise<Booking[]> {
    const bookingsList = await db.query.bookings.findMany({
      where: and(eq(bookings.eventId, eventId), eq(bookings.customerEmail, customerEmail)),
    });

    const result: Booking[] = [];

    for (const bookingData of bookingsList) {
      const items = await db.query.bookingItems.findMany({
        where: eq(bookingItems.bookingId, bookingData.id),
      });

      result.push(
        Booking.fromPrimitives({
          ...bookingData,
          items: items.map((item) => ({
            ticketCategoryId: item.ticketCategoryId,
            quantity: item.quantity,
            unitPrice: parseFloat(item.unitPrice),
            currency: item.currency,
          })),
          totalAmount: parseFloat(bookingData.totalAmount),
        })
      );
    }

    return result;
  }
}
