import { NotFoundError } from "@/domain/errors/domain-error";
import type { BookingRepository } from "@/domain/repositories/booking-repository";

export class ConfirmBookingUseCase {
  constructor(private readonly bookingRepository: BookingRepository) {}

  async execute(id: string) {
    const booking = await this.bookingRepository.findById(id);

    if (!booking) {
      throw new NotFoundError("Booking");
    }

    booking.confirm();
    await this.bookingRepository.save(booking);

    return booking.toJSON();
  }
}
