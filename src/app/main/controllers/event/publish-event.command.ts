import { NotFoundError } from "@/app/main/shared/errors/domain-error";
import { EventRepository } from "@/app/main/repositories/event/event-repository";
import { Command, CommandHandler } from "@/app/main/shared/interfaces/command";

export class PublishEventCommand implements Command {
  constructor(public readonly eventId: string) {}
}

export class PublishEventHandler implements CommandHandler<PublishEventCommand> {
  constructor(private eventRepository: EventRepository) {}

  async execute(command: PublishEventCommand): Promise<void> {
    const event = await this.eventRepository.findById(command.eventId);
    if (!event) {
      throw new NotFoundError("Event", command.eventId);
    }

    event.publish();
    await this.eventRepository.save(event);
  }
}
