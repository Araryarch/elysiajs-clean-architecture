import { createId } from "@/shared/id";
import { NotFoundError, DomainError } from "@/domain/errors/domain-error";
import { Refund } from "@/domain/entities/refund";
import { BookingStatus } from "@/domain/entities/booking-status";
import { TicketStatus } from "@/domain/entities/ticket-status";
import { BookingRepository } from "@/domain/repositories/booking-repository";
import { ITicketRepository } from "@/domain/repositories/ticket-repository";
import { IRefundRepository } from "@/domain/repositories/refund-repository";
import { Command, CommandHandler } from "@/application/commands/command";

export class RequestRefundCommand implements Command {
  constructor(public readonly bookingId: string) {}
}

export class RequestRefundHandler implements CommandHandler<RequestRefundCommand, string> {
  constructor(
    private bookingRepository: BookingRepository,
    private ticketRepository: ITicketRepository,
    private refundRepository: IRefundRepository,
  ) {}

  async execute(command: RequestRefundCommand): Promise<string> {
    const booking = await this.bookingRepository.findById(command.bookingId);
    if (!booking) {
      throw new NotFoundError("Booking", command.bookingId);
    }

    if (booking.status !== BookingStatus.PAID) {
      throw new DomainError("Only paid bookings can request refund", 400, "INVALID_BOOKING_STATUS");
    }

    // Check if any ticket has been checked in
    const tickets = await this.ticketRepository.findByBookingId(command.bookingId);
    const hasCheckedIn = tickets.some((t) => t.status === TicketStatus.CHECKED_IN);
    if (hasCheckedIn) {
      throw new DomainError(
        "Cannot request refund for bookings with checked-in tickets",
        400,
        "TICKETS_ALREADY_USED",
      );
    }

    const refund = Refund.create({
      id: createId("refund"),
      bookingId: booking.id,
      amount: booking.totalAmount,
    });

    await this.refundRepository.save(refund);
    return refund.id;
  }
}
