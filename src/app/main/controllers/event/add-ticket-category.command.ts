import { createId } from "@/app/main/shared/utils/helpers/id";
import { NotFoundError, DomainError } from "@/app/main/shared/errors/domain-error";
import { TicketCategory } from "@/app/main/entities/event/ticket-category";
import { DateRange } from "@/app/main/shared/utils/helpers/date-range";
import { Money } from "@/app/main/shared/utils/helpers/money";
import { EventRepository } from "@/app/main/repositories/event/event-repository";
import { Command, CommandHandler } from "@/app/main/shared/interfaces/command";

export class AddTicketCategoryCommand implements Command {
  constructor(
    public readonly eventId: string,
    public readonly name: string,
    public readonly price: number,
    public readonly quota: number,
    public readonly salesStart: Date,
    public readonly salesEnd: Date,
  ) {}
}

export class AddTicketCategoryHandler implements CommandHandler<AddTicketCategoryCommand, string> {
  constructor(private eventRepository: EventRepository) {}

  async execute(command: AddTicketCategoryCommand): Promise<string> {
    const event = await this.eventRepository.findById(command.eventId);
    if (!event) {
      throw new NotFoundError("Event", command.eventId);
    }

    // Sales period must end before or at the event start date (AC from US4)
    if (command.salesEnd > event.startAt) {
      throw new DomainError("Ticket sales period must end before or at the event start date");
    }

    const category = TicketCategory.create({
      id: createId("category"),
      eventId: command.eventId,
      name: command.name,
      price: new Money(command.price),
      quota: command.quota,
      salesPeriod: new DateRange(command.salesStart, command.salesEnd),
    });

    // This validates total quota does not exceed event capacity
    event.addTicketCategory(category);
    await this.eventRepository.save(event);

    return category.id;
  }
}
