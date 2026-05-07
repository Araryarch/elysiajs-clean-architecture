import { Refund } from "@/app/main/entities/refund/refund";

export interface IRefundRepository {
  findAll(): Promise<Refund[]>;
  save(refund: Refund): Promise<void>;
  findById(id: string): Promise<Refund | null>;
  findByBookingId(bookingId: string): Promise<Refund[]>;
}
