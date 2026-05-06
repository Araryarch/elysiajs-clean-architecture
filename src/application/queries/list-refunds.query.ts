import { IRefundRepository } from "@/domain/repositories/refund-repository";
import { Query, QueryHandler } from "@/application/queries/query";

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

export class ListRefundsQuery implements Query {
  constructor(
    public readonly status?: string,
    public readonly bookingId?: string,
  ) {}
}

export class ListRefundsHandler implements QueryHandler<ListRefundsQuery, RefundDTO[]> {
  constructor(private refundRepository: IRefundRepository) {}

  async execute(query: ListRefundsQuery): Promise<RefundDTO[]> {
    let refunds = await this.refundRepository.findAll();

    // Filter by status
    if (query.status) {
      refunds = refunds.filter((r) => r.status === query.status);
    }

    // Filter by booking ID
    if (query.bookingId) {
      refunds = refunds.filter((r) => r.bookingId === query.bookingId);
    }

    return refunds.map((refund) => {
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
    });
  }
}
