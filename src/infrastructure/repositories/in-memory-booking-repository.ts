import { Booking } from "@/domain/entities/booking";
import type { BookingRepository } from "@/domain/repositories/booking-repository";

type BookingRecord = ReturnType<Booking["toJSON"]>;

export class InMemoryBookingRepository implements BookingRepository {
  private readonly bookings = new Map<string, BookingRecord>();

  async findById(id: string): Promise<Booking | null> {
    const booking = this.bookings.get(id);
    return booking ? Booking.fromPrimitives(booking) : null;
  }

  async findByEventId(eventId: string): Promise<Booking[]> {
    const result: Booking[] = [];
    for (const booking of this.bookings.values()) {
      if (booking.eventId === eventId) {
        result.push(Booking.fromPrimitives(booking));
      }
    }
    return result;
  }

  async findByEventAndCustomer(eventId: string, customerEmail: string): Promise<Booking[]> {
    const result: Booking[] = [];
    for (const booking of this.bookings.values()) {
      if (booking.eventId === eventId && booking.customerEmail === customerEmail) {
        result.push(Booking.fromPrimitives(booking));
      }
    }
    return result;
  }

  async save(booking: Booking): Promise<void> {
    this.bookings.set(booking.id, booking.toJSON());
  }
}
