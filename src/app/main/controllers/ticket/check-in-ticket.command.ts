import { NotFoundError } from "@/app/main/shared/errors/domain-error";
import { ITicketRepository } from "@/app/main/repositories/ticket/ticket-repository";
import { EventRepository } from "@/app/main/repositories/event/event-repository";
import { Command, CommandHandler } from "@/app/main/shared/interfaces/command";

export class CheckInTicketCommand implements Command {
  constructor(
    public readonly ticketCode: string,
    public readonly eventId: string,
  ) {}
}

export class CheckInTicketHandler implements CommandHandler<CheckInTicketCommand> {
  constructor(
    private ticketRepository: ITicketRepository,
    private eventRepository: EventRepository,
  ) {}

  async execute(command: CheckInTicketCommand): Promise<void> {
    const ticket = await this.ticketRepository.findByCode(command.ticketCode);
    if (!ticket) {
      throw new NotFoundError("Ticket");
    }

    const event = await this.eventRepository.findById(command.eventId);
    if (!event) {
      throw new NotFoundError("Event", command.eventId);
    }

    ticket.checkIn(command.eventId, event.startAt);
    await this.ticketRepository.save(ticket);
  }
}
