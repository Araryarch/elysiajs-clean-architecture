import { createId } from "@/app/main/shared/utils/helpers/id";
import { Event } from "@/app/main/entities/event/event";
import { TicketCategory } from "@/app/main/entities/event/ticket-category";
import { DateRange } from "@/app/main/shared/utils/helpers/date-range";
import { Money } from "@/app/main/shared/utils/helpers/money";
import { EventRepository } from "@/app/main/repositories/event/event-repository";
import { Command, CommandHandler } from "@/app/main/shared/interfaces/command";

export class CreateEventCommand implements Command {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly venue: string,
    public readonly startAt: Date,
    public readonly endAt: Date,
    public readonly maxCapacity: number,
    public readonly ticketCategories: Array<{
      name: string;
      price: number;
      quota: number;
      salesStart: Date;
      salesEnd: Date;
    }>,
  ) {}
}

export class CreateEventHandler implements CommandHandler<CreateEventCommand, string> {
  constructor(private eventRepository: EventRepository) {}

  async execute(command: CreateEventCommand): Promise<string> {
    const eventId = createId("event");

    const categories = command.ticketCategories.map((cat) =>
      TicketCategory.create({
        id: createId("category"),
        eventId,
        name: cat.name,
        price: new Money(cat.price),
        quota: cat.quota,
        salesPeriod: new DateRange(cat.salesStart, cat.salesEnd),
      }),
    );

    const event = Event.create({
      id: eventId,
      name: command.name,
      description: command.description,
      venue: command.venue,
      startAt: command.startAt,
      endAt: command.endAt,
      maxCapacity: command.maxCapacity,
      ticketCategories: categories,
    });

    await this.eventRepository.save(event);
    return event.id;
  }
}
