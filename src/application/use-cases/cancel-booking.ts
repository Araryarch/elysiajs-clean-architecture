import { NotFoundError } from "@/domain/errors/domain-error";
import { BookingStatus } from "@/domain/entities/booking-status";
import type { BookingRepository } from "@/domain/repositories/booking-repository";
import type { EventRepository } from "@/domain/repositories/event-repository";

export class CancelBookingUseCase {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly eventRepository: EventRepository,
  ) {}

  async execute(id: string) {
    const booking = await this.bookingRepository.findById(id);

    if (!booking) {
      throw new NotFoundError("Booking");
    }

    // Note: Booking entity doesn't have cancel method yet
    // This use case might need to be implemented differently
    // For now, we'll just release tickets if booking is not already cancelled
    const shouldReleaseTickets = booking.status !== BookingStatus.REFUNDED;

    if (shouldReleaseTickets) {
      const event = await this.eventRepository.findById(booking.eventId);

      if (event) {
        event.releaseTickets(booking.items);
        await this.eventRepository.save(event);
      }
    }

    await this.bookingRepository.save(booking);

    return booking.toJSON();
  }
}
