import { IRefundRepository } from "../repository/refund-repository";
import { BookingRepository } from "../../booking/repository/booking-repository";
import { Query, QueryHandler } from "../../../application/interfaces/query";

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

export class GetCustomerRefundsQuery implements Query {
  constructor(public readonly customerEmail: string) {}
}

export class GetCustomerRefundsHandler implements QueryHandler<
  GetCustomerRefundsQuery,
  RefundDTO[]
> {
  constructor(
    private refundRepository: IRefundRepository,
    private bookingRepository: BookingRepository,
  ) {}

  async execute(query: GetCustomerRefundsQuery): Promise<RefundDTO[]> {
    const customerBookings = await this.bookingRepository.findByCustomerEmail(
      query.customerEmail,
    );

    const refundDTOs: RefundDTO[] = [];
    for (const booking of customerBookings) {
      const refunds = await this.refundRepository.findByBookingId(booking.id);

      for (const refund of refunds) {
        const json = refund.toJSON();
        refundDTOs.push({
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
        });
      }
    }

    return refundDTOs.sort(
      (a, b) =>
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
    );
  }
}
