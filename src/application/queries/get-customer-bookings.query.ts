import { BookingRepository } from "@/domain/repositories/booking-repository";
import { EventRepository } from "@/domain/repositories/event-repository";
import { BookingDTO } from "@/application/dtos/dtos";
import { Query, QueryHandler } from "@/application/queries/query";

export class GetCustomerBookingsQuery implements Query {
  constructor(public readonly customerEmail: string) {}
}

export class GetCustomerBookingsHandler implements QueryHandler<GetCustomerBookingsQuery, BookingDTO[]> {
  constructor(
    private bookingRepository: BookingRepository,
    private eventRepository: EventRepository,
  ) {}

  async execute(query: GetCustomerBookingsQuery): Promise<BookingDTO[]> {
    const allBookings = await this.bookingRepository.findAll();
    
    // Filter by customer email
    const customerBookings = allBookings.filter(
      (b) => b.toJSON().customerEmail.toLowerCase() === query.customerEmail.toLowerCase(),
    );

    // Map to DTOs
    const bookingDTOs: BookingDTO[] = [];
    for (const booking of customerBookings) {
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

    // Sort by created date (newest first)
    return bookingDTOs.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}
