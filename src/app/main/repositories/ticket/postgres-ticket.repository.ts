import { eq } from "drizzle-orm";
import { Ticket } from "@/app/main/entities/ticket/ticket";
import { ITicketRepository } from "@/app/main/repositories/ticket/ticket-repository";
import { TicketCode } from "@/app/main/shared/utils/helpers/ticket-code";
import { db } from "@/app/main/database/drizzle/index/connection";
import { tickets } from "@/app/main/database/drizzle/schema/schema";

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
