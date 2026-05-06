import { Ticket } from "@/domain/entities/ticket";

export interface ITicketRepository {
  save(ticket: Ticket): Promise<void>;
  findById(id: string): Promise<Ticket | null>;
  findByCode(code: string): Promise<Ticket | null>;
  findByBookingId(bookingId: string): Promise<Ticket[]>;
  findByEventId(eventId: string): Promise<Ticket[]>;
}
