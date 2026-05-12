import { eq, and, sql } from "drizzle-orm";
import { Booking } from "../../../entities/booking/booking";
import { BookingRepository } from "./booking-repository";
import { Email } from "../../../shared/utils/validation/email";
import { Money } from "../../../shared/utils/helpers/money";
import { db } from "../../../database/drizzle/index/connection";
import { bookings, bookingItems } from "../../../database/drizzle/schema/schema";
import { createId } from "../../../shared/utils/helpers/id";

export class PostgresBookingRepository implements BookingRepository {
  async save(booking: Booking): Promise<void> {
    const json = booking.toJSON();

    await db.transaction(async (tx) => {

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

  async findByCustomerEmail(customerEmail: string): Promise<Booking[]> {
    const bookingsList = await db.query.bookings.findMany({
      where: eq(bookings.customerEmail, customerEmail.toLowerCase()),
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

  async findAll(): Promise<Booking[]> {
    const bookingsList = await db.query.bookings.findMany();
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

