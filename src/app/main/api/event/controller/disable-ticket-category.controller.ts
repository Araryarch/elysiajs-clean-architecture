import { NotFoundError, DomainError } from "../../../shared/errors/domain-error";
import { EventStatus } from "../../../entities/event/event-status";
import { EventRepository } from "../repository/event-repository";
import { Command, CommandHandler } from "../../../shared/interfaces/command";

export class DisableTicketCategoryCommand implements Command {
  constructor(
    public readonly eventId: string,
    public readonly categoryId: string,
  ) {}
}

export class DisableTicketCategoryHandler implements CommandHandler<DisableTicketCategoryCommand> {
  constructor(private eventRepository: EventRepository) {}

  async execute(command: DisableTicketCategoryCommand): Promise<void> {
    const event = await this.eventRepository.findById(command.eventId);
    if (!event) {
      throw new NotFoundError("Event", command.eventId);
    }

    if (event.status === EventStatus.COMPLETED) {
      throw new DomainError("Cannot disable ticket category for completed event");
    }

    const category = event.ticketCategories.find((c) => c.id === command.categoryId);
    if (!category) {
      throw new NotFoundError("Ticket Category", command.categoryId);
    }

    category.disable();
    await this.eventRepository.save(event);
  }
}

