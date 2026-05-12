import type { Booking } from "../../../entities/booking/booking";

export interface BookingRepository {
  findAll(): Promise<Booking[]>;
  findById(id: string): Promise<Booking | null>;
  findByEventId(eventId: string): Promise<Booking[]>;
  findByCustomerEmail(customerEmail: string): Promise<Booking[]>;
  findByEventAndCustomer(
    eventId: string,
    customerEmail: string,
  ): Promise<Booking[]>;
  save(booking: Booking): Promise<void>;
}
