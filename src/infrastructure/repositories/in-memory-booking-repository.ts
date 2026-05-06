import { Booking } from "@/domain/entities/booking";
import type { BookingRepository } from "@/domain/repositories/booking-repository";

type BookingRecord = ReturnType<Booking["toJSON"]>;

export class InMemoryBookingRepository implements BookingRepository {
  private readonly bookings = new Map<string, BookingRecord>();

  async findById(id: string): Promise<Booking | null> {
    const booking = this.bookings.get(id);
    return booking ? this.toEntity(booking) : null;
  }

  async save(booking: Booking): Promise<void> {
    this.bookings.set(booking.id, booking.toJSON());
  }

  private toEntity(booking: BookingRecord) {
    return new Booking({
      ...booking,
      createdAt: new Date(booking.createdAt),
      confirmedAt: booking.confirmedAt ? new Date(booking.confirmedAt) : undefined,
      canceledAt: booking.canceledAt ? new Date(booking.canceledAt) : undefined,
      items: booking.items.map((item) => ({ ...item })),
    });
  }
}
