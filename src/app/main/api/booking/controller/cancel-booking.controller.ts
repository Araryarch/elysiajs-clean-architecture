import {
  NotFoundError,
  DomainError,
} from "../../../domain/errors/domain-error";
import { BookingRepository } from "../repository/booking-repository";
import { EventRepository } from "../../event/repository/event-repository";
import { BookingStatus } from "../../../entities/booking/booking-status";
import {
  Command,
  CommandHandler,
} from "../../../application/interfaces/command";

export class CancelBookingCommand implements Command {
  constructor(public readonly bookingId: string) {}
}

export class CancelBookingHandler implements CommandHandler<
  CancelBookingCommand,
  void
> {
  constructor(
    private bookingRepository: BookingRepository,
    private eventRepository: EventRepository,
  ) {}

  async execute(command: CancelBookingCommand): Promise<void> {
    const booking = await this.bookingRepository.findById(command.bookingId);
    if (!booking) {
      throw new NotFoundError("Booking", command.bookingId);
    }

    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new DomainError(
        "Only pending bookings can be cancelled. Paid bookings require refund request.",
        400,
        "INVALID_BOOKING_STATUS",
      );
    }

    const event = await this.eventRepository.findById(booking.eventId);
    if (event) {
      for (const item of booking.items) {
        event.releaseQuota(item.ticketCategoryId, item.quantity);
      }
      await this.eventRepository.save(event);
    }

    booking.expire();
    await this.bookingRepository.save(booking);
  }
}
