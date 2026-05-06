import { createId } from "@/shared/id";
import { Booking } from "@/domain/entities/booking";
import { NotFoundError, ConflictError, DomainError } from "@/domain/errors/domain-error";
import { Email } from "@/domain/value-objects/email";
import { Money } from "@/domain/value-objects/money";
import { BookingStatus } from "@/domain/entities/booking-status";
import { EventRepository } from "@/domain/repositories/event-repository";
import { BookingRepository } from "@/domain/repositories/booking-repository";
import { Command, CommandHandler } from "@/application/commands/command";

export class CreateBookingCommand implements Command {
  constructor(
    public readonly eventId: string,
    public readonly customerName: string,
    public readonly customerEmail: string,
    public readonly items: Array<{ ticketCategoryId: string; quantity: number }>,
  ) {}
}

export class CreateBookingHandler implements CommandHandler<CreateBookingCommand, string> {
  constructor(
    private eventRepository: EventRepository,
    private bookingRepository: BookingRepository,
  ) {}

  async execute(command: CreateBookingCommand): Promise<string> {
    const event = await this.eventRepository.findById(command.eventId);
    if (!event) {
      throw new NotFoundError("Event", command.eventId);
    }

    // Check for existing active booking
    const existingBookings = await this.bookingRepository.findByEventAndCustomer(
      command.eventId,
      command.customerEmail,
    );
    const hasActiveBooking = existingBookings.some(
      (b) => b.status === BookingStatus.PENDING_PAYMENT || b.status === BookingStatus.PAID,
    );
    if (hasActiveBooking) {
      throw new ConflictError("Customer already has an active booking for this event");
    }

    // US8: Validate each ticket category is purchasable (active, within sales period, has quota)
    const now = new Date();
    for (const item of command.items) {
      const category = event.ticketCategories.find((c) => c.id === item.ticketCategoryId);
      if (!category) {
        throw new NotFoundError("Ticket Category", item.ticketCategoryId);
      }
      if (!category.isActive) {
        throw new DomainError(
          `Ticket category '${category.name}' is not active`,
          400,
          "CATEGORY_INACTIVE",
        );
      }
      if (!category.salesPeriod.isActive(now)) {
        throw new DomainError(
          `Ticket category '${category.name}' is not within sales period`,
          400,
          "SALES_PERIOD_INVALID",
        );
      }
    }

    // Reserve tickets
    event.reserveTickets(command.items);

    // Calculate total
    const total = event.calculateTotal(command.items);

    // Create booking items with unit prices
    const bookingItems = command.items.map((item) => {
      const category = event.ticketCategories.find((c) => c.id === item.ticketCategoryId);
      return {
        ticketCategoryId: item.ticketCategoryId,
        quantity: item.quantity,
        unitPrice: category!.price,
      };
    });

    const booking = Booking.create({
      id: createId("booking"),
      eventId: command.eventId,
      customerName: command.customerName,
      customerEmail: new Email(command.customerEmail),
      items: bookingItems,
      totalAmount: total,
    });

    await this.eventRepository.save(event);
    await this.bookingRepository.save(booking);

    return booking.id;
  }
}
