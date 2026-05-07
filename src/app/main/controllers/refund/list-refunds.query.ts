import { IRefundRepository } from "@/app/main/repositories/refund/refund-repository";
import { Query, QueryHandler } from "@/app/main/shared/interfaces/query";
import { PaginatedResult, paginate } from "@/app/main/shared/types/pagination.dto";

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
    public readonly page?: number,
    public readonly limit?: number,
  ) {}
}

export class ListRefundsHandler implements QueryHandler<ListRefundsQuery, PaginatedResult<RefundDTO>> {
  constructor(private refundRepository: IRefundRepository) {}

  async execute(query: ListRefundsQuery): Promise<PaginatedResult<RefundDTO>> {
    let refunds = await this.refundRepository.findAll();

    // Filter by status
    if (query.status) {
      refunds = refunds.filter((r) => r.status === query.status);
    }

    // Filter by booking ID
    if (query.bookingId) {
      refunds = refunds.filter((r) => r.bookingId === query.bookingId);
    }

    const refundDTOs = refunds.map((refund) => {
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

    return paginate(refundDTOs, query.page, query.limit);
  }
}
