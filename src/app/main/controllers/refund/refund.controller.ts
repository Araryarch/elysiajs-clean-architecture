import { Elysia, t, type TSchema } from "elysia";
import { RequestRefundCommand, RequestRefundHandler } from "@/app/main/controllers/refund/request-refund.command";
import { ApproveRefundCommand, ApproveRefundHandler } from "@/app/main/controllers/refund/approve-refund.command";
import { RejectRefundCommand, RejectRefundHandler } from "@/app/main/controllers/refund/reject-refund.command";
import { PayoutRefundCommand, PayoutRefundHandler } from "@/app/main/controllers/refund/payout-refund.command";
import { GetRefundQuery, GetRefundHandler } from "@/app/main/controllers/refund/get-refund.query";
import { ListRefundsQuery, ListRefundsHandler } from "@/app/main/controllers/refund/list-refunds.query";
import { BookingRepository } from "@/app/main/repositories/booking/booking-repository";
import { ITicketRepository } from "@/app/main/repositories/ticket/ticket-repository";
import { IRefundRepository } from "@/app/main/repositories/refund/refund-repository";
import { IRefundPaymentService } from "@/app/main/services/interfaces";
import { EventBus } from "@/app/main/shared/events/event-bus";
import { success } from "@/app/main/shared/utils/response/response";

const SuccessResponse = <T extends TSchema>(data: T) =>
  t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: data,
  });

const IdResponse = t.Object({ id: t.String() });
const NullResponse = t.Null();

const RefundSchema = t.Object({
  id: t.String(),
  bookingId: t.String(),
  amount: t.Number(),
  currency: t.String(),
  status: t.String(),
  requestedAt: t.String(),
  approvedAt: t.Optional(t.String()),
  rejectedAt: t.Optional(t.String()),
  paidOutAt: t.Optional(t.String()),
  rejectionReason: t.Optional(t.String()),
  paymentReference: t.Optional(t.String()),
});

const PaginationSchema = t.Object({
  page: t.Number(),
  limit: t.Number(),
  total: t.Number(),
  totalPages: t.Number(),
  hasNext: t.Boolean(),
  hasPrev: t.Boolean(),
});

const PaginatedRefundsSchema = t.Object({
  data: t.Array(RefundSchema),
  pagination: PaginationSchema,
});

export const createRefundController = (deps: {
  bookingRepository: BookingRepository;
  ticketRepository: ITicketRepository;
  refundRepository: IRefundRepository;
  refundPaymentService: IRefundPaymentService;
  eventBus: EventBus;
}) => {
  const requestRefundHandler = new RequestRefundHandler(
    deps.bookingRepository,
    deps.ticketRepository,
    deps.refundRepository
  );
  const approveRefundHandler = new ApproveRefundHandler(deps.refundRepository, deps.eventBus);
  const rejectRefundHandler = new RejectRefundHandler(deps.refundRepository);
  const payoutRefundHandler = new PayoutRefundHandler(deps.refundRepository, deps.refundPaymentService);
  const getRefundHandler = new GetRefundHandler(deps.refundRepository);
  const listRefundsHandler = new ListRefundsHandler(deps.refundRepository);

  return new Elysia({ prefix: "/api/v1/refunds" })
    .post(
      "/",
      async ({ body }) => {
        const refundId = await requestRefundHandler.execute(new RequestRefundCommand(body.bookingId));
        return success({ id: refundId }, "Refund requested successfully");
      },
      {
        body: t.Object({
          bookingId: t.String({ minLength: 1 }),
        }),
        response: {
          200: SuccessResponse(IdResponse),
        },
        detail: {
          summary: "Request Refund",
          description: "Request a refund for a booking",
          tags: ["Refunds"],
        },
      }
    )
    .post(
      "/:id/approve",
      async ({ params }) => {
        await approveRefundHandler.execute(new ApproveRefundCommand(params.id));
        return success(null, "Refund approved successfully");
      },
      {
        response: {
          200: SuccessResponse(NullResponse),
        },
        detail: {
          summary: "Approve Refund",
          description: "Approve a refund request (Event Organizer only)",
          tags: ["Refunds"],
        },
      }
    )
    .post(
      "/:id/reject",
      async ({ params, body }) => {
        await rejectRefundHandler.execute(new RejectRefundCommand(params.id, body.reason));
        return success(null, "Refund rejected successfully");
      },
      {
        body: t.Object({
          reason: t.String({ minLength: 1 }),
        }),
        response: {
          200: SuccessResponse(NullResponse),
        },
        detail: {
          summary: "Reject Refund",
          description: "Reject a refund request (Event Organizer only)",
          tags: ["Refunds"],
        },
      }
    )
    .post(
      "/:id/payout",
      async ({ params }) => {
        await payoutRefundHandler.execute(new PayoutRefundCommand(params.id));
        return success(null, "Refund paid out successfully");
      },
      {
        response: {
          200: SuccessResponse(NullResponse),
        },
        detail: {
          summary: "Payout Refund",
          description: "Mark refund as paid out (System Admin only)",
          tags: ["Refunds"],
        },
      }
    )
    .get(
      "/",
      async ({ query }) => {
        const page = query.page ? parseInt(query.page) : 1;
        const limit = query.limit ? parseInt(query.limit) : 10;
        const result = await listRefundsHandler.execute(
          new ListRefundsQuery(query.status, query.bookingId, page, limit),
        );
        return success(result, "Refunds retrieved successfully");
      },
      {
        query: t.Object({
          status: t.Optional(t.String()),
          bookingId: t.Optional(t.String()),
          page: t.Optional(t.String()),
          limit: t.Optional(t.String()),
        }),
        response: {
          200: SuccessResponse(PaginatedRefundsSchema),
        },
        detail: {
          summary: "List Refunds",
          description: "Get paginated list of refunds with optional filters (Admin/Organizer)",
          tags: ["Refunds"],
        },
      }
    )
    .get(
      "/:id",
      async ({ params }) => {
        const result = await getRefundHandler.execute(new GetRefundQuery(params.id));
        return success(result, "Refund retrieved successfully");
      },
      {
        response: {
          200: SuccessResponse(RefundSchema),
        },
        detail: {
          summary: "Get Refund Details",
          description: "Get detailed information about a refund",
          tags: ["Refunds"],
        },
      }
    );
};
