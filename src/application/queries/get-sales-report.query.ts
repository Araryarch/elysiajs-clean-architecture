import { NotFoundError } from "@/domain/errors/domain-error";
import { BookingStatus } from "@/domain/entities/booking-status";
import { EventRepository } from "@/domain/repositories/event-repository";
import { BookingRepository } from "@/domain/repositories/booking-repository";
import { SalesReportDTO } from "@/application/dtos/dtos";
import { Query, QueryHandler } from "@/application/queries/query";

export class GetSalesReportQuery implements Query {
  constructor(public readonly eventId: string) {}
}

export class GetSalesReportHandler implements QueryHandler<GetSalesReportQuery, SalesReportDTO> {
  constructor(
    private eventRepository: EventRepository,
    private bookingRepository: BookingRepository,
  ) {}

  async execute(query: GetSalesReportQuery): Promise<SalesReportDTO> {
    const event = await this.eventRepository.findById(query.eventId);
    if (!event) {
      throw new NotFoundError("Event", query.eventId);
    }

    const bookings = await this.bookingRepository.findByEventId(query.eventId);

    // Calculate category sales
    const categorySales = new Map<string, { name: string; quantity: number; revenue: number }>();

    for (const category of event.ticketCategories) {
      categorySales.set(category.id, {
        name: category.name,
        quantity: 0,
        revenue: 0,
      });
    }

    let totalRevenue = 0;
    const bookingStats = {
      pendingPayment: 0,
      paid: 0,
      expired: 0,
      refunded: 0,
    };

    for (const booking of bookings) {
      // Count booking status
      if (booking.status === BookingStatus.PENDING_PAYMENT) bookingStats.pendingPayment++;
      else if (booking.status === BookingStatus.PAID) bookingStats.paid++;
      else if (booking.status === BookingStatus.EXPIRED) bookingStats.expired++;
      else if (booking.status === BookingStatus.REFUNDED) bookingStats.refunded++;

      // Calculate sales for paid bookings
      if (booking.status === BookingStatus.PAID) {
        totalRevenue += booking.totalAmount.amount;

        for (const item of booking.items) {
          const catSales = categorySales.get(item.ticketCategoryId);
          if (catSales) {
            catSales.quantity += item.quantity;
            catSales.revenue += item.unitPrice.amount * item.quantity;
          }
        }
      }
    }

    return {
      eventId: event.id,
      eventName: event.toJSON().name,
      categorySales: Array.from(categorySales.values()).map((cat) => ({
        categoryName: cat.name,
        soldQuantity: cat.quantity,
        revenue: cat.revenue,
      })),
      bookingStats,
      totalRevenue,
    };
  }
}
