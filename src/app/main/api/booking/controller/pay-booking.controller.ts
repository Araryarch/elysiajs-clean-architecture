import { createId } from "../../../application/id";
import { NotFoundError } from "../../../domain/errors/domain-error";
import { Money } from "../../../domain/value-objects/money";
import { Ticket } from "../../../entities/ticket/ticket";
import { BookingRepository } from "../repository/booking-repository";
import { ITicketRepository } from "../../ticket/repository/ticket-repository";
import { IPaymentGateway } from "../../../application/interfaces/services";
import {
  Command,
  CommandHandler,
} from "../../../application/interfaces/command";

export class PayBookingCommand implements Command {
  constructor(
    public readonly bookingId: string,
    public readonly amount: number,
  ) {}
}

export class PayBookingHandler implements CommandHandler<PayBookingCommand> {
  constructor(
    private bookingRepository: BookingRepository,
    private ticketRepository: ITicketRepository,
    private paymentGateway: IPaymentGateway,
  ) {}

  async execute(command: PayBookingCommand): Promise<void> {
    const booking = await this.bookingRepository.findById(command.bookingId);
    if (!booking) {
      throw new NotFoundError("Booking", command.bookingId);
    }

    await this.paymentGateway.processPayment({
      bookingId: booking.id,
      amount: command.amount,
    });

    booking.pay(new Money(command.amount));
    await this.bookingRepository.save(booking);

    const tickets: Ticket[] = [];
    for (const item of booking.items) {
      for (let i = 0; i < item.quantity; i++) {
        const ticket = Ticket.create({
          id: createId("ticket"),
          bookingId: booking.id,
          eventId: booking.eventId,
          ticketCategoryId: item.ticketCategoryId,
          customerName: booking.toJSON().customerName,
        });
        tickets.push(ticket);
      }
    }

    for (const ticket of tickets) {
      await this.ticketRepository.save(ticket);
    }
  }
}
