import { createId } from "@/shared/id";
import { Event } from "@/domain/entities/event";
import { TicketCategory } from "@/domain/entities/ticket-category";
import { DateRange } from "@/domain/value-objects/date-range";
import { Money } from "@/domain/value-objects/money";
import { EventRepository } from "@/domain/repositories/event-repository";
import { Command, CommandHandler } from "@/application/commands/command";

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
