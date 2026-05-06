import { Elysia, t, type TSchema } from "elysia";
import { CheckInTicketCommand, CheckInTicketHandler } from "@/application/commands/check-in-ticket.command";
import { ITicketRepository } from "@/domain/repositories/ticket-repository";
import { EventRepository } from "@/domain/repositories/event-repository";
import { success } from "@/presentation/http/response";

const SuccessResponse = <T extends TSchema>(data: T) =>
  t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: data,
  });

const NullResponse = t.Null();

export const createTicketController = (deps: {
  ticketRepository: ITicketRepository;
  eventRepository: EventRepository;
}) => {
  const checkInHandler = new CheckInTicketHandler(deps.ticketRepository, deps.eventRepository);

  return new Elysia({ prefix: "/api/v1/tickets" }).post(
    "/check-in",
    async ({ body }) => {
      await checkInHandler.execute(new CheckInTicketCommand(body.ticketCode, body.eventId));
      return success(null, "Ticket checked in successfully");
    },
    {
      body: t.Object({
        ticketCode: t.String({ minLength: 1 }),
        eventId: t.String({ minLength: 1 }),
      }),
      response: {
        200: SuccessResponse(NullResponse),
      },
      detail: {
        summary: "Check In Ticket",
        description: "Check in a ticket at the event (Gate Officer only)",
        tags: ["Tickets"],
      },
    }
  );
};
