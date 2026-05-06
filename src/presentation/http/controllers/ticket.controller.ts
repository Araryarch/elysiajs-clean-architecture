import { Elysia, t } from "elysia";
import { CheckInTicketCommand, CheckInTicketHandler } from "@/application/commands/check-in-ticket.command";
import { ITicketRepository } from "@/domain/repositories/ticket-repository";
import { EventRepository } from "@/domain/repositories/event-repository";
import { success } from "@/presentation/http/response";

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
        ticketCode: t.String(),
        eventId: t.String(),
      }),
    }
  );
};
