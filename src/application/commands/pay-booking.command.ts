import { createId } from "@/shared/id";
import { NotFoundError } from "@/domain/errors/domain-error";
import { Money } from "@/domain/value-objects/money";
import { Ticket } from "@/domain/entities/ticket";
import { BookingRepository } from "@/domain/repositories/booking-repository";
import { ITicketRepository } from "@/domain/repositories/ticket-repository";
import { IPaymentGateway } from "@/application/services/interfaces";
import { Command, CommandHandler } from "@/application/commands/command";

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

    // Process payment through gateway
    await this.paymentGateway.processPayment({
      bookingId: booking.id,
      amount: command.amount,
    });

    // Mark booking as paid
    booking.pay(new Money(command.amount));
    await this.bookingRepository.save(booking);

    // Issue tickets
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
