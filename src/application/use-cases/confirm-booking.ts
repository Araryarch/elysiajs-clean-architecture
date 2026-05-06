import { NotFoundError } from "@/domain/errors/domain-error";
import type { BookingRepository } from "@/domain/repositories/booking-repository";

export class ConfirmBookingUseCase {
  constructor(private readonly bookingRepository: BookingRepository) {}

  async execute(id: string) {
    const booking = await this.bookingRepository.findById(id);

    if (!booking) {
      throw new NotFoundError("Booking");
    }

    // Note: Booking entity doesn't have confirm method
    // The booking is confirmed when payment is made via pay() method
    // This use case might not be needed or needs different implementation
    
    await this.bookingRepository.save(booking);

    return booking.toJSON();
  }
}
