import { NotFoundError } from "../../../shared/errors/domain-error";
import { ITicketRepository } from "../repository/ticket-repository";
import { EventRepository } from "../../event/repository/event-repository";
import { Command, CommandHandler } from "../../../shared/interfaces/command";

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
