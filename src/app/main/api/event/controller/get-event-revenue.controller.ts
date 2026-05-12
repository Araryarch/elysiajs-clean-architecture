import { NotFoundError } from "../../../domain/errors/domain-error";
import { EventRepository } from "../repository/event-repository";
import { BookingRepository } from "../../booking/repository/booking-repository";
import { BookingStatus } from "../../../entities/booking/booking-status";
import { Query, QueryHandler } from "../../../application/interfaces/query";

export type EventRevenueDTO = {
  eventId: string;
  eventName: string;
  totalRevenue: number;
  currency: string;
  revenueByCategory: Array<{
    categoryName: string;
    revenue: number;
    ticketsSold: number;
    averagePrice: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    bookingsCount: number;
  }>;
  revenueByStatus: {
    paid: number;
    refunded: number;
    net: number;
  };
};

export class GetEventRevenueQuery implements Query {
  constructor(public readonly eventId: string) {}
}

export class GetEventRevenueHandler implements QueryHandler<
  GetEventRevenueQuery,
  EventRevenueDTO
> {
  constructor(
    private eventRepository: EventRepository,
    private bookingRepository: BookingRepository,
  ) {}

  async execute(query: GetEventRevenueQuery): Promise<EventRevenueDTO> {
    const event = await this.eventRepository.findById(query.eventId);
    if (!event) {
      throw new NotFoundError("Event", query.eventId);
    }

    const eventJson = event.toJSON();
    const bookings = await this.bookingRepository.findByEventId(query.eventId);
    const paidBookings = bookings.filter(
      (b) => b.status === BookingStatus.PAID,
    );
    const refundedBookings = bookings.filter(
      (b) => b.status === BookingStatus.REFUNDED,
    );

    const totalRevenue = paidBookings.reduce(
      (sum, b) => sum + b.toJSON().totalAmount,
      0,
    );
    const refundedAmount = refundedBookings.reduce(
      (sum, b) => sum + b.toJSON().totalAmount,
      0,
    );

    const categoryRevenue = new Map<
      string,
      { revenue: number; count: number }
    >();
    for (const booking of paidBookings) {
      const json = booking.toJSON();
      for (const item of json.items) {
        const category = eventJson.ticketCategories.find(
          (c) => c.id === item.ticketCategoryId,
        );
        const categoryName = category?.name || "Unknown";
        const itemRevenue = item.unitPrice * item.quantity;

        const current = categoryRevenue.get(categoryName) || {
          revenue: 0,
          count: 0,
        };
        categoryRevenue.set(categoryName, {
          revenue: current.revenue + itemRevenue,
          count: current.count + item.quantity,
        });
      }
    }

    const revenueByCategory = Array.from(categoryRevenue.entries()).map(
      ([name, data]) => ({
        categoryName: name,
        revenue: data.revenue,
        ticketsSold: data.count,
        averagePrice: data.count > 0 ? data.revenue / data.count : 0,
      }),
    );

    const monthlyRevenue = new Map<
      string,
      { revenue: number; count: number }
    >();
    for (const booking of paidBookings) {
      const json = booking.toJSON();
      const paidAt = json.paidAt;
      if (paidAt) {
        const month = `${paidAt.getFullYear()}-${String(paidAt.getMonth() + 1).padStart(2, "0")}`;
        const current = monthlyRevenue.get(month) || { revenue: 0, count: 0 };
        monthlyRevenue.set(month, {
          revenue: current.revenue + json.totalAmount,
          count: current.count + 1,
        });
      }
    }

    const revenueByMonth = Array.from(monthlyRevenue.entries())
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        bookingsCount: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      eventId: query.eventId,
      eventName: eventJson.name,
      totalRevenue,
      currency: "IDR",
      revenueByCategory,
      revenueByMonth,
      revenueByStatus: {
        paid: totalRevenue,
        refunded: refundedAmount,
        net: totalRevenue - refundedAmount,
      },
    };
  }
}
