import { NotFoundError, DomainError } from "@/domain/errors/domain-error";
import { BookingRepository } from "@/domain/repositories/booking-repository";
import { EventRepository } from "@/domain/repositories/event-repository";
import { BookingStatus } from "@/domain/entities/booking-status";
import { Command, CommandHandler } from "@/application/commands/command";

export class CancelBookingCommand implements Command {
  constructor(public readonly bookingId: string) {}
}

export class CancelBookingHandler implements CommandHandler<CancelBookingCommand, void> {
  constructor(
    private bookingRepository: BookingRepository,
    private eventRepository: EventRepository,
  ) {}

  async execute(command: CancelBookingCommand): Promise<void> {
    const booking = await this.bookingRepository.findById(command.bookingId);
    if (!booking) {
      throw new NotFoundError("Booking", command.bookingId);
    }

    // Only pending bookings can be cancelled by customer
    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new DomainError(
        "Only pending bookings can be cancelled. Paid bookings require refund request.",
        400,
        "INVALID_BOOKING_STATUS",
      );
    }

    // Release the quota back to event
    const event = await this.eventRepository.findById(booking.eventId);
    if (event) {
      for (const item of booking.items) {
        event.releaseQuota(item.ticketCategoryId, item.quantity);
      }
      await this.eventRepository.save(event);
    }

    // Mark booking as expired (cancelled)
    booking.expire();
    await this.bookingRepository.save(booking);
  }
}
