import { Elysia, t, type TSchema } from "elysia";
import { GetDashboardStatsQuery, GetDashboardStatsHandler } from "@/application/queries/get-dashboard-stats.query";
import { EventRepository } from "@/domain/repositories/event-repository";
import { BookingRepository } from "@/domain/repositories/booking-repository";
import { ITicketRepository } from "@/domain/repositories/ticket-repository";
import { IRefundRepository } from "@/domain/repositories/refund-repository";
import { success } from "@/presentation/http/response";

const SuccessResponse = <T extends TSchema>(data: T) =>
  t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: data,
  });

export const createDashboardController = (deps: {
  eventRepository: EventRepository;
  bookingRepository: BookingRepository;
  ticketRepository: ITicketRepository;
  refundRepository: IRefundRepository;
}) => {
  const getDashboardStatsHandler = new GetDashboardStatsHandler(
    deps.eventRepository,
    deps.bookingRepository,
    deps.ticketRepository,
    deps.refundRepository,
  );

  const DashboardStatsSchema = t.Object({
    events: t.Object({
      total: t.Number(),
      draft: t.Number(),
      published: t.Number(),
      cancelled: t.Number(),
      completed: t.Number(),
    }),
    bookings: t.Object({
      total: t.Number(),
      pendingPayment: t.Number(),
      paid: t.Number(),
      expired: t.Number(),
      refunded: t.Number(),
    }),
    tickets: t.Object({
      total: t.Number(),
      active: t.Number(),
      checkedIn: t.Number(),
      cancelled: t.Number(),
    }),
    revenue: t.Object({
      total: t.Number(),
      currency: t.String(),
      thisMonth: t.Number(),
    }),
    refunds: t.Object({
      total: t.Number(),
      requested: t.Number(),
      approved: t.Number(),
      rejected: t.Number(),
      paidOut: t.Number(),
    }),
  });

  return new Elysia({ prefix: "/api/v1/dashboard" }).get(
    "/stats",
    async () => {
      const result = await getDashboardStatsHandler.execute();
      return success(result, "Dashboard stats retrieved successfully");
    },
    {
      response: {
        200: SuccessResponse(DashboardStatsSchema),
      },
      detail: {
        summary: "Get Dashboard Statistics",
        description: "Get overall system statistics (Admin only)",
        tags: ["Dashboard"],
      },
    },
  );
};
