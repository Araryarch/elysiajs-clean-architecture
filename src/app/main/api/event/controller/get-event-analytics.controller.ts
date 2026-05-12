import { NotFoundError } from "../../../domain/errors/domain-error";
import { EventRepository } from "../repository/event-repository";
import { BookingRepository } from "../../booking/repository/booking-repository";
import { ITicketRepository } from "../../ticket/repository/ticket-repository";
import { BookingStatus } from "../../../entities/booking/booking-status";
import { Query, QueryHandler } from "../../../application/interfaces/query";

export type EventAnalyticsDTO = {
  eventId: string;
  eventName: string;
  totalCapacity: number;
  ticketsSold: number;
  ticketsCheckedIn: number;
  occupancyRate: number;
  conversionRate: number;
  totalRevenue: number;
  averageTicketPrice: number;
  categoryPerformance: Array<{
    categoryName: string;
    quota: number;
    sold: number;
    revenue: number;
    sellThroughRate: number;
  }>;
  bookingsByStatus: {
    pending: number;
    paid: number;
    expired: number;
    refunded: number;
  };
  salesTimeline: {
    firstSale?: string;
    lastSale?: string;
    peakSalesDay?: string;
  };
};

export class GetEventAnalyticsQuery implements Query {
  constructor(public readonly eventId: string) {}
}

export class GetEventAnalyticsHandler implements QueryHandler<
  GetEventAnalyticsQuery,
  EventAnalyticsDTO
> {
  constructor(
    private eventRepository: EventRepository,
    private bookingRepository: BookingRepository,
    private ticketRepository: ITicketRepository,
  ) {}

  async execute(query: GetEventAnalyticsQuery): Promise<EventAnalyticsDTO> {
    const event = await this.eventRepository.findById(query.eventId);
    if (!event) {
      throw new NotFoundError("Event", query.eventId);
    }

    const eventJson = event.toJSON();
    const bookings = await this.bookingRepository.findByEventId(query.eventId);
    const tickets = await this.ticketRepository.findByEventId(query.eventId);

    const paidBookings = bookings.filter(
      (b) => b.status === BookingStatus.PAID,
    );
    const totalBookings = bookings.length;
    const ticketsSold = tickets.length;
    const ticketsCheckedIn = tickets.filter(
      (t) => t.toJSON().status === "CheckedIn",
    ).length;

    const totalRevenue = paidBookings.reduce(
      (sum, b) => sum + b.toJSON().totalAmount,
      0,
    );
    const averageTicketPrice = ticketsSold > 0 ? totalRevenue / ticketsSold : 0;
    const occupancyRate = (ticketsSold / eventJson.maxCapacity) * 100;
    const conversionRate =
      totalBookings > 0 ? (paidBookings.length / totalBookings) * 100 : 0;

    const categoryPerformance = eventJson.ticketCategories.map((cat) => {
      const sold = cat.bookedQuantity;
      const revenue = sold * cat.price;
      const sellThroughRate = (sold / cat.quota) * 100;

      return {
        categoryName: cat.name,
        quota: cat.quota,
        sold,
        revenue,
        sellThroughRate,
      };
    });

    const bookingsByStatus = {
      pending: bookings.filter(
        (b) => b.status === BookingStatus.PENDING_PAYMENT,
      ).length,
      paid: bookings.filter((b) => b.status === BookingStatus.PAID).length,
      expired: bookings.filter((b) => b.status === BookingStatus.EXPIRED)
        .length,
      refunded: bookings.filter((b) => b.status === BookingStatus.REFUNDED)
        .length,
    };

    const paidDates = paidBookings
      .map((b) => b.toJSON().paidAt)
      .filter((date): date is Date => date !== undefined)
      .sort((a, b) => a.getTime() - b.getTime());

    const salesTimeline = {
      firstSale: paidDates[0]?.toISOString(),
      lastSale: paidDates[paidDates.length - 1]?.toISOString(),
      peakSalesDay: this.findPeakSalesDay(paidDates),
    };

    return {
      eventId: query.eventId,
      eventName: eventJson.name,
      totalCapacity: eventJson.maxCapacity,
      ticketsSold,
      ticketsCheckedIn,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
      totalRevenue,
      averageTicketPrice: Math.round(averageTicketPrice * 100) / 100,
      categoryPerformance,
      bookingsByStatus,
      salesTimeline,
    };
  }

  private findPeakSalesDay(dates: Date[]): string | undefined {
    if (dates.length === 0) return undefined;

    const dayCounts = new Map<string, number>();
    for (const date of dates) {
      const day = date.toISOString().split("T")[0];
      if (day) {
        dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
      }
    }

    let peakDay = "";
    let maxCount = 0;
    for (const [day, count] of dayCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        peakDay = day;
      }
    }

    return peakDay || undefined;
  }
}
