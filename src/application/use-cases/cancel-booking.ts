import { NotFoundError } from "@/domain/errors/domain-error";
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

    const shouldReleaseTickets = booking.status !== "CANCELED";
    booking.cancel();

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
