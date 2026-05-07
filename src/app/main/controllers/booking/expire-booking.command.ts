import { NotFoundError } from "@/app/main/shared/errors/domain-error";
import { EventRepository } from "@/app/main/repositories/event/event-repository";
import { BookingRepository } from "@/app/main/repositories/booking/booking-repository";
import { Command, CommandHandler } from "@/app/main/shared/interfaces/command";

export class ExpireBookingCommand implements Command {
  constructor(public readonly bookingId: string) {}
}

export class ExpireBookingHandler implements CommandHandler<ExpireBookingCommand> {
  constructor(
    private bookingRepository: BookingRepository,
    private eventRepository: EventRepository,
  ) {}

  async execute(command: ExpireBookingCommand): Promise<void> {
    const booking = await this.bookingRepository.findById(command.bookingId);
    if (!booking) {
      throw new NotFoundError("Booking", command.bookingId);
    }

    // Domain entity validates: must be PendingPayment and past deadline
    booking.expire();

    // Release reserved ticket quota back to the event (AC from US11)
    const event = await this.eventRepository.findById(booking.eventId);
    if (event) {
      event.releaseTickets(
        booking.items.map((item) => ({
          ticketCategoryId: item.ticketCategoryId,
          quantity: item.quantity,
        })),
      );
      await this.eventRepository.save(event);
    }

    await this.bookingRepository.save(booking);
  }
}
