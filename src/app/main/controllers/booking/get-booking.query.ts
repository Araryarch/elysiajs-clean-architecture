import { NotFoundError } from "@/app/main/shared/errors/domain-error";
import { BookingRepository } from "@/app/main/repositories/booking/booking-repository";
import { EventRepository } from "@/app/main/repositories/event/event-repository";
import { BookingDTO } from "@/app/main/shared/types/dtos";
import { Query, QueryHandler } from "@/app/main/shared/interfaces/query";

export class GetBookingQuery implements Query {
  constructor(public readonly bookingId: string) {}
}

export class GetBookingHandler implements QueryHandler<GetBookingQuery, BookingDTO> {
  constructor(
    private bookingRepository: BookingRepository,
    private eventRepository: EventRepository,
  ) {}

  async execute(query: GetBookingQuery): Promise<BookingDTO> {
    const booking = await this.bookingRepository.findById(query.bookingId);
    if (!booking) {
      throw new NotFoundError("Booking", query.bookingId);
    }

    const event = await this.eventRepository.findById(booking.eventId);
    const json = booking.toJSON();

    return {
      id: json.id,
      eventId: json.eventId,
      customerName: json.customerName,
      customerEmail: json.customerEmail,
      items: json.items.map((item) => {
        const category = event?.ticketCategories.find((c) => c.id === item.ticketCategoryId);
        return {
          ticketCategoryId: item.ticketCategoryId,
          ticketCategoryName: category?.name || "Unknown",
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        };
      }),
      totalAmount: json.totalAmount,
      currency: json.currency,
      status: json.status,
      paymentDeadline: json.paymentDeadline.toISOString(),
      createdAt: json.createdAt.toISOString(),
      paidAt: json.paidAt?.toISOString(),
    };
  }
}
