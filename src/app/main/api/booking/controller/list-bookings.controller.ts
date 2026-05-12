import { BookingRepository } from "../repository/booking-repository";
import { EventRepository } from "../../event/repository/event-repository";
import { BookingDTO } from "../../../shared/types/dtos";
import { Query, QueryHandler } from "../../../shared/interfaces/query";
import { PaginatedResult, paginate } from "../../../shared/types/pagination.dto";

export class ListBookingsQuery implements Query {
  constructor(
    public readonly eventId?: string,
    public readonly status?: string,
    public readonly customerEmail?: string,
    public readonly page?: number,
    public readonly limit?: number,
  ) {}
}

export class ListBookingsHandler implements QueryHandler<ListBookingsQuery, PaginatedResult<BookingDTO>> {
  constructor(
    private bookingRepository: BookingRepository,
    private eventRepository: EventRepository,
  ) {}

  async execute(query: ListBookingsQuery): Promise<PaginatedResult<BookingDTO>> {
    let bookings = await this.bookingRepository.findAll();

    if (query.eventId) {
      bookings = bookings.filter((b) => b.eventId === query.eventId);
    }

    if (query.status) {
      bookings = bookings.filter((b) => b.status === query.status);
    }

    if (query.customerEmail) {
      bookings = bookings.filter(
        (b) => b.toJSON().customerEmail.toLowerCase() === query.customerEmail!.toLowerCase(),
      );
    }

    const bookingDTOs: BookingDTO[] = [];
    for (const booking of bookings) {
      const event = await this.eventRepository.findById(booking.eventId);
      const json = booking.toJSON();

      bookingDTOs.push({
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
      });
    }

    return paginate(bookingDTOs, query.page, query.limit);
  }
}

