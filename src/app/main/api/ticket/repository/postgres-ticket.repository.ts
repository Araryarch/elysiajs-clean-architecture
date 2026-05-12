import { eq } from "drizzle-orm";
import { Ticket } from "../../../entities/ticket/ticket";
import { ITicketRepository } from "./ticket-repository";
import { db } from "../../../database/drizzle/index/connection";
import { tickets } from "../../../database/drizzle/schema/schema";

export class PostgresTicketRepository implements ITicketRepository {
  async save(ticket: Ticket): Promise<void> {
    const json = ticket.toJSON();

    await db
      .insert(tickets)
      .values({
        id: json.id,
        bookingId: json.bookingId,
        eventId: json.eventId,
        ticketCategoryId: json.ticketCategoryId,
        ticketCode: json.ticketCode,
        customerName: json.customerName,
        status: json.status,
        issuedAt: json.issuedAt,
        checkedInAt: json.checkedInAt,
      })
      .onConflictDoUpdate({
        target: tickets.id,
        set: {
          status: json.status,
          checkedInAt: json.checkedInAt,
        },
      });
  }

  async findById(id: string): Promise<Ticket | null> {
    const ticketData = await db.query.tickets.findFirst({
      where: eq(tickets.id, id),
    });

    if (!ticketData) return null;

    return Ticket.fromPrimitives(ticketData);
  }

  async findByCode(code: string): Promise<Ticket | null> {
    const ticketData = await db.query.tickets.findFirst({
      where: eq(tickets.ticketCode, code),
    });

    if (!ticketData) return null;

    return Ticket.fromPrimitives(ticketData);
  }

  async findByBookingId(bookingId: string): Promise<Ticket[]> {
    const ticketsList = await db.query.tickets.findMany({
      where: eq(tickets.bookingId, bookingId),
    });

    return ticketsList.map((t) => Ticket.fromPrimitives(t));
  }

  async findByEventId(eventId: string): Promise<Ticket[]> {
    const ticketsList = await db.query.tickets.findMany({
      where: eq(tickets.eventId, eventId),
    });

    return ticketsList.map((t) => Ticket.fromPrimitives(t));
  }

  async findAll(): Promise<Ticket[]> {
    const ticketsList = await db.query.tickets.findMany();
    return ticketsList.map((t) => Ticket.fromPrimitives(t));
  }
}
