import { Ticket } from "@/app/main/entities/ticket/ticket";

export interface ITicketRepository {
  findAll(): Promise<Ticket[]>;
  save(ticket: Ticket): Promise<void>;
  findById(id: string): Promise<Ticket | null>;
  findByCode(code: string): Promise<Ticket | null>;
  findByBookingId(bookingId: string): Promise<Ticket[]>;
  findByEventId(eventId: string): Promise<Ticket[]>;
}
