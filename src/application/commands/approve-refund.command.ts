import { NotFoundError } from "@/domain/errors/domain-error";
import { TicketStatus } from "@/domain/entities/ticket-status";
import { IRefundRepository } from "@/domain/repositories/refund-repository";
import { BookingRepository } from "@/domain/repositories/booking-repository";
import { ITicketRepository } from "@/domain/repositories/ticket-repository";
import { Command, CommandHandler } from "@/application/commands/command";

export class ApproveRefundCommand implements Command {
  constructor(public readonly refundId: string) {}
}

export class ApproveRefundHandler implements CommandHandler<ApproveRefundCommand> {
  constructor(
    private refundRepository: IRefundRepository,
    private bookingRepository: BookingRepository,
    private ticketRepository: ITicketRepository,
  ) {}

  async execute(command: ApproveRefundCommand): Promise<void> {
    const refund = await this.refundRepository.findById(command.refundId);
    if (!refund) {
      throw new NotFoundError("Refund", command.refundId);
    }

    refund.approve();

    const booking = await this.bookingRepository.findById(refund.bookingId);
    if (!booking) {
      throw new NotFoundError("Booking", refund.bookingId);
    }

    booking.markAsRefunded();

    const tickets = await this.ticketRepository.findByBookingId(refund.bookingId);
    for (const ticket of tickets) {
      if (ticket.status !== TicketStatus.CHECKED_IN) {
        ticket.cancel();
        await this.ticketRepository.save(ticket);
      }
    }

    await this.refundRepository.save(refund);
    await this.bookingRepository.save(booking);
  }
}
