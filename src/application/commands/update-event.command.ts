import { NotFoundError, DomainError } from "@/domain/errors/domain-error";
import { EventRepository } from "@/domain/repositories/event-repository";
import { EventStatus } from "@/domain/entities/event-status";
import { Command, CommandHandler } from "@/application/commands/command";

export class UpdateEventCommand implements Command {
  constructor(
    public readonly eventId: string,
    public readonly name?: string,
    public readonly description?: string,
    public readonly venue?: string,
    public readonly startAt?: Date,
    public readonly endAt?: Date,
    public readonly maxCapacity?: number,
  ) {}
}

export class UpdateEventHandler implements CommandHandler<UpdateEventCommand, void> {
  constructor(private eventRepository: EventRepository) {}

  async execute(command: UpdateEventCommand): Promise<void> {
    const event = await this.eventRepository.findById(command.eventId);
    if (!event) {
      throw new NotFoundError("Event", command.eventId);
    }

    // Only draft events can be updated
    if (event.status !== EventStatus.DRAFT) {
      throw new DomainError(
        "Only draft events can be updated. Published events cannot be modified.",
        400,
        "INVALID_EVENT_STATUS",
      );
    }

    // Update fields if provided
    if (command.name !== undefined) {
      event.updateName(command.name);
    }

    if (command.description !== undefined) {
      event.updateDescription(command.description);
    }

    if (command.venue !== undefined) {
      event.updateVenue(command.venue);
    }

    if (command.startAt !== undefined && command.endAt !== undefined) {
      event.updateSchedule(command.startAt, command.endAt);
    }

    if (command.maxCapacity !== undefined) {
      event.updateMaxCapacity(command.maxCapacity);
    }

    await this.eventRepository.save(event);
  }
}
