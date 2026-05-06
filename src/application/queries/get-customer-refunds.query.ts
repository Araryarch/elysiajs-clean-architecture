import { IRefundRepository } from "@/domain/repositories/refund-repository";
import { BookingRepository } from "@/domain/repositories/booking-repository";
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

export class GetCustomerRefundsQuery implements Query {
  constructor(public readonly customerEmail: string) {}
}

export class GetCustomerRefundsHandler implements QueryHandler<GetCustomerRefundsQuery, RefundDTO[]> {
  constructor(
    private refundRepository: IRefundRepository,
    private bookingRepository: BookingRepository,
  ) {}

  async execute(query: GetCustomerRefundsQuery): Promise<RefundDTO[]> {
    // Get all customer bookings
    const allBookings = await this.bookingRepository.findAll();
    const customerBookings = allBookings.filter(
      (b) => b.toJSON().customerEmail.toLowerCase() === query.customerEmail.toLowerCase(),
    );

    // Get all refunds for customer bookings
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

    // Sort by requested date (newest first)
    return refundDTOs.sort((a, b) => 
      new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );
  }
}
