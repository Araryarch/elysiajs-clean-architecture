import { Elysia, t, type TSchema } from "elysia";
import { RequestRefundCommand, RequestRefundHandler } from "@/application/commands/request-refund.command";
import { ApproveRefundCommand, ApproveRefundHandler } from "@/application/commands/approve-refund.command";
import { RejectRefundCommand, RejectRefundHandler } from "@/application/commands/reject-refund.command";
import { PayoutRefundCommand, PayoutRefundHandler } from "@/application/commands/payout-refund.command";
import { BookingRepository } from "@/domain/repositories/booking-repository";
import { ITicketRepository } from "@/domain/repositories/ticket-repository";
import { IRefundRepository } from "@/domain/repositories/refund-repository";
import { IRefundPaymentService } from "@/application/services/interfaces";
import { success } from "@/presentation/http/response";

const SuccessResponse = <T extends TSchema>(data: T) =>
  t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: data,
  });

const IdResponse = t.Object({ id: t.String() });
const NullResponse = t.Null();

export const createRefundController = (deps: {
  bookingRepository: BookingRepository;
  ticketRepository: ITicketRepository;
  refundRepository: IRefundRepository;
  refundPaymentService: IRefundPaymentService;
}) => {
  const requestRefundHandler = new RequestRefundHandler(
    deps.bookingRepository,
    deps.ticketRepository,
    deps.refundRepository
  );
  const approveRefundHandler = new ApproveRefundHandler(
    deps.refundRepository,
    deps.bookingRepository,
    deps.ticketRepository
  );
  const rejectRefundHandler = new RejectRefundHandler(deps.refundRepository);
  const payoutRefundHandler = new PayoutRefundHandler(deps.refundRepository, deps.refundPaymentService);

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
    );
};
