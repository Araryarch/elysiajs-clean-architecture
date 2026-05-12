import { NotFoundError } from "../../../shared/errors/domain-error";
import { EventRepository } from "../repository/event-repository";
import { EventBus } from "../../../shared/events/event-bus";
import { Command, CommandHandler } from "../../../shared/interfaces/command";

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

    event.cancel();
    await this.eventRepository.save(event);

    await this.eventBus.dispatchAll(event.getDomainEvents());
    event.clearDomainEvents();
  }
}

