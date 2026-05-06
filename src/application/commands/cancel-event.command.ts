import { NotFoundError } from "@/domain/errors/domain-error";
import { EventRepository } from "@/domain/repositories/event-repository";
import { BookingRepository } from "@/domain/repositories/booking-repository";
import { Command, CommandHandler } from "@/application/commands/command";

export class CancelEventCommand implements Command {
  constructor(public readonly eventId: string) {}
}

export class CancelEventHandler implements CommandHandler<CancelEventCommand> {
  constructor(
    private eventRepository: EventRepository,
    private bookingRepository: BookingRepository,
  ) {}

  async execute(command: CancelEventCommand): Promise<void> {
    const event = await this.eventRepository.findById(command.eventId);
    if (!event) {
      throw new NotFoundError("Event", command.eventId);
    }

    event.cancel();
    await this.eventRepository.save(event);

    // Mark paid bookings as requiring refund (handled by domain event in real implementation)
  }
}
