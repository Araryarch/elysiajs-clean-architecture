import { NotFoundError } from "../../../domain/errors/domain-error";
import { EventRepository } from "../../event/repository/event-repository";
import { BookingRepository } from "../repository/booking-repository";
import {
  Command,
  CommandHandler,
} from "../../../application/interfaces/command";

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

    booking.expire();

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
