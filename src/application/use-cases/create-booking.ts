import { Booking } from "@/domain/entities/booking";
import { NotFoundError } from "@/domain/errors/domain-error";
import type { BookingRepository } from "@/domain/repositories/booking-repository";
import type { EventRepository } from "@/domain/repositories/event-repository";
import { createId } from "@/shared/id";

export type CreateBookingInput = {
  eventId: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    ticketCategoryId: string;
    quantity: number;
  }>;
};

export class CreateBookingUseCase {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly bookingRepository: BookingRepository,
  ) {}

  async execute(input: CreateBookingInput) {
    const event = await this.eventRepository.findById(input.eventId);

    if (!event) {
      throw new NotFoundError("Event");
    }

    event.reserveTickets(input.items);

    const bookingItems = input.items.map((item) => {
      const ticketCategory = event.ticketCategories.find((category) => category.id === item.ticketCategoryId);

      if (!ticketCategory) {
        throw new NotFoundError("Ticket category");
      }

      return {
        ticketCategoryId: item.ticketCategoryId,
        quantity: item.quantity,
        unitPrice: ticketCategory.price,
      };
    });

    const booking = new Booking({
      id: createId("bkg"),
      eventId: input.eventId,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      items: bookingItems,
      totalAmount: event.calculateTotal(input.items),
      status: "PENDING",
      createdAt: new Date(),
    });

    await this.eventRepository.save(event);
    await this.bookingRepository.save(booking);

    return booking.toJSON();
  }
}
