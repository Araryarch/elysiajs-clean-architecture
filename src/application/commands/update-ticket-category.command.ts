import { NotFoundError, DomainError } from "@/domain/errors/domain-error";
import { EventRepository } from "@/domain/repositories/event-repository";
import { EventStatus } from "@/domain/entities/event-status";
import { Command, CommandHandler } from "@/application/commands/command";

export class UpdateTicketCategoryCommand implements Command {
  constructor(
    public readonly eventId: string,
    public readonly categoryId: string,
    public readonly name?: string,
    public readonly price?: number,
    public readonly quota?: number,
    public readonly salesStart?: Date,
    public readonly salesEnd?: Date,
  ) {}
}

export class UpdateTicketCategoryHandler implements CommandHandler<UpdateTicketCategoryCommand, void> {
  constructor(private eventRepository: EventRepository) {}

  async execute(command: UpdateTicketCategoryCommand): Promise<void> {
    const event = await this.eventRepository.findById(command.eventId);
    if (!event) {
      throw new NotFoundError("Event", command.eventId);
    }

    // Only draft events can have categories updated
    if (event.status !== EventStatus.DRAFT) {
      throw new DomainError(
        "Only draft events can have ticket categories updated.",
        400,
        "INVALID_EVENT_STATUS",
      );
    }

    const category = event.ticketCategories.find((c) => c.id === command.categoryId);
    if (!category) {
      throw new NotFoundError("Ticket Category", command.categoryId);
    }

    // Update fields if provided
    if (command.name !== undefined) {
      category.updateName(command.name);
    }

    if (command.price !== undefined) {
      category.updatePrice(command.price);
    }

    if (command.quota !== undefined) {
      category.updateQuota(command.quota);
    }

    if (command.salesStart !== undefined && command.salesEnd !== undefined) {
      category.updateSalesPeriod(command.salesStart, command.salesEnd);
    }

    await this.eventRepository.save(event);
  }
}
