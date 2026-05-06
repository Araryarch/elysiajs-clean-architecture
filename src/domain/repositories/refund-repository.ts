import { Refund } from "@/domain/entities/refund";

export interface IRefundRepository {
  save(refund: Refund): Promise<void>;
  findById(id: string): Promise<Refund | null>;
  findByBookingId(bookingId: string): Promise<Refund[]>;
}
