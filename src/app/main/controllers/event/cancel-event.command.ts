import { NotFoundError } from "@/app/main/shared/errors/domain-error";
import { EventRepository } from "@/app/main/repositories/event/event-repository";
import { EventBus } from "@/app/main/shared/events/event-bus";
import { Command, CommandHandler } from "@/app/main/shared/interfaces/command";

export class CancelEventCommand implements Command {
  constructor(public readonly eventId: string) {}
}

export class CancelEventHandler implements CommandHandler<CancelEventCommand> {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CancelEventCommand): Promise<void> {
    const event = await this.eventRepository.findById(command.eventId);
    if (!event) {
      throw new NotFoundError("Event", command.eventId);
    }

    // Domain logic: validates status, emits EventCancelled domain event
    event.cancel();
    await this.eventRepository.save(event);

    // Dispatch domain events — EventCancelledBookingHandler reacts in the booking context
    await this.eventBus.dispatchAll(event.getDomainEvents());
    event.clearDomainEvents();
  }
}
