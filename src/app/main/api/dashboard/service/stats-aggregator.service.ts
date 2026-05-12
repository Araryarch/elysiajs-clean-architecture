export interface PeriodStats {
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  totalBookings: number;
  totalTickets: number;
}

export interface IStatsAggregatorService {
  aggregateByPeriod(
    bookings: Array<{
      totalAmount: number;
      status: string;
      paidAt?: Date | null;
      items: Array<{ quantity: number }>;
    }>,
    startDate: Date,
    endDate: Date,
  ): PeriodStats;

  calculateGrowthRate(current: number, previous: number): number;
}

export class StatsAggregatorService implements IStatsAggregatorService {
  aggregateByPeriod(
    bookings: Array<{
      totalAmount: number;
      status: string;
      paidAt?: Date | null;
      items: Array<{ quantity: number }>;
    }>,
    startDate: Date,
    endDate: Date,
  ): PeriodStats {
    const periodBookings = bookings.filter((b) => {
      const paidAt = b.paidAt;
      return (
        (b.status === "Paid" || b.status === "Refunded") &&
        paidAt != null &&
        paidAt >= startDate &&
        paidAt <= endDate
      );
    });

    const totalRevenue = periodBookings.reduce(
      (sum, b) => sum + b.totalAmount,
      0,
    );
    const totalTickets = periodBookings.reduce(
      (sum, b) => sum + b.items.reduce((s, i) => s + i.quantity, 0),
      0,
    );

    return {
      startDate,
      endDate,
      totalRevenue,
      totalBookings: periodBookings.length,
      totalTickets,
    };
  }

  calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 100) / 100;
  }
}
