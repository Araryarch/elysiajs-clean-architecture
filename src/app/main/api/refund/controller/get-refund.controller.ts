import { NotFoundError } from "../../../shared/errors/domain-error";
import { IRefundRepository } from "../repository/refund-repository";
import { Query, QueryHandler } from "../../../shared/interfaces/query";

export type RefundDTO = {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: string;
  requestedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  paidOutAt?: string;
  rejectionReason?: string;
  paymentReference?: string;
};

export class GetRefundQuery implements Query {
  constructor(public readonly refundId: string) {}
}

export class GetRefundHandler implements QueryHandler<GetRefundQuery, RefundDTO> {
  constructor(private refundRepository: IRefundRepository) {}

  async execute(query: GetRefundQuery): Promise<RefundDTO> {
    const refund = await this.refundRepository.findById(query.refundId);
    if (!refund) {
      throw new NotFoundError("Refund", query.refundId);
    }

    const json = refund.toJSON();
    return {
      id: json.id,
      bookingId: json.bookingId,
      amount: json.amount,
      currency: json.currency,
      status: json.status,
      requestedAt: json.requestedAt.toISOString(),
      approvedAt: json.approvedAt?.toISOString(),
      rejectedAt: json.rejectedAt?.toISOString(),
      paidOutAt: json.paidOutAt?.toISOString(),
      rejectionReason: json.rejectionReason,
      paymentReference: json.paymentReference,
    };
  }
}
