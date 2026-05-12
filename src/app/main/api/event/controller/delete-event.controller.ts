import {
  NotFoundError,
  DomainError,
} from "../../../domain/errors/domain-error";
import { EventRepository } from "../repository/event-repository";
import { EventStatus } from "../../../entities/event/event-status";
import {
  Command,
  CommandHandler,
} from "../../../application/interfaces/command";

export class DeleteEventCommand implements Command {
  constructor(public readonly eventId: string) {}
}

export class DeleteEventHandler implements CommandHandler<
  DeleteEventCommand,
  void
> {
  constructor(private eventRepository: EventRepository) {}

  async execute(command: DeleteEventCommand): Promise<void> {
    const event = await this.eventRepository.findById(command.eventId);
    if (!event) {
      throw new NotFoundError("Event", command.eventId);
    }

    if (event.status !== EventStatus.DRAFT) {
      throw new DomainError(
        "Only draft events can be deleted. Published or cancelled events cannot be removed.",
        400,
        "INVALID_EVENT_STATUS",
      );
    }

    await this.eventRepository.delete(command.eventId);
  }
}
