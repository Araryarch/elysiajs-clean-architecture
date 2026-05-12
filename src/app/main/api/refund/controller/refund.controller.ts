import { RequestRefundCommand } from "./request-refund.controller";
import { ApproveRefundCommand } from "./approve-refund.controller";
import { RejectRefundCommand } from "./reject-refund.controller";
import { PayoutRefundCommand } from "./payout-refund.controller";
import { GetRefundQuery } from "./get-refund.controller";
import { ListRefundsQuery } from "./list-refunds.controller";
import type { RequestRefundHandler } from "./request-refund.controller";
import type { ApproveRefundHandler } from "./approve-refund.controller";
import type { RejectRefundHandler } from "./reject-refund.controller";
import type { PayoutRefundHandler } from "./payout-refund.controller";
import type { GetRefundHandler } from "./get-refund.controller";
import type { ListRefundsHandler } from "./list-refunds.controller";
import { success } from "../../../shared/utils/response/response";

export type RefundControllerHandlers = {
  requestRefundHandler: RequestRefundHandler;
  approveRefundHandler: ApproveRefundHandler;
  rejectRefundHandler: RejectRefundHandler;
  payoutRefundHandler: PayoutRefundHandler;
  getRefundHandler: GetRefundHandler;
  listRefundsHandler: ListRefundsHandler;
};

export const createRefundController = (handlers: RefundControllerHandlers) => ({
  request(body: { bookingId: string }) {
    return handlers.requestRefundHandler.execute(new RequestRefundCommand(body.bookingId))
      .then((refundId) => success({ id: refundId }, "Refund requested successfully"));
  },

  approve(params: { id: string }) {
    return handlers.approveRefundHandler.execute(new ApproveRefundCommand(params.id))
      .then(() => success(null, "Refund approved successfully"));
  },

  reject(params: { id: string }, body?: { reason?: string }) {
    return handlers.rejectRefundHandler.execute(new RejectRefundCommand(params.id, body?.reason || "Rejected by admin"))
      .then(() => success(null, "Refund rejected successfully"));
  },

  payout(params: { id: string }) {
    return handlers.payoutRefundHandler.execute(new PayoutRefundCommand(params.id))
      .then(() => success(null, "Refund paid out successfully"));
  },

  list(query: { status?: string; bookingId?: string; page?: string; limit?: string }) {
    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 10;
    return handlers.listRefundsHandler.execute(new ListRefundsQuery(query.status, query.bookingId, page, limit))
      .then((result) => success(result, "Refunds retrieved successfully"));
  },

  getById(params: { id: string }) {
    return handlers.getRefundHandler.execute(new GetRefundQuery(params.id))
      .then((result) => success(result, "Refund retrieved successfully"));
  },
});

export type RefundController = ReturnType<typeof createRefundController>;
