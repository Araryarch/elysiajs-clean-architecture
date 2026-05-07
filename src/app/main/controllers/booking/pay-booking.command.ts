import { createId } from "@/app/main/shared/utils/helpers/id";
import { NotFoundError } from "@/app/main/shared/errors/domain-error";
import { Money } from "@/app/main/shared/utils/helpers/money";
import { Ticket } from "@/app/main/entities/ticket/ticket";
import { BookingRepository } from "@/app/main/repositories/booking/booking-repository";
import { ITicketRepository } from "@/app/main/repositories/ticket/ticket-repository";
import { IPaymentGateway } from "@/app/main/services/interfaces";
import { Command, CommandHandler } from "@/app/main/shared/interfaces/command";

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
