import { Elysia, t, type TSchema } from "elysia";
import { CheckInTicketCommand, CheckInTicketHandler } from "@/application/commands/check-in-ticket.command";
import { GetTicketQuery, GetTicketHandler } from "@/application/queries/get-ticket.query";
import { SearchTicketsQuery, SearchTicketsHandler } from "@/application/queries/search-tickets.query";
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

const TicketSchema = t.Object({
  id: t.String(),
  ticketCode: t.String(),
  eventName: t.String(),
  categoryName: t.String(),
  customerName: t.String(),
  status: t.String(),
  issuedAt: t.String(),
  checkedInAt: t.Optional(t.String()),
});

export const createTicketController = (deps: {
  ticketRepository: ITicketRepository;
  eventRepository: EventRepository;
}) => {
  const checkInHandler = new CheckInTicketHandler(deps.ticketRepository, deps.eventRepository);
  const getTicketHandler = new GetTicketHandler(deps.ticketRepository, deps.eventRepository);
  const searchTicketsHandler = new SearchTicketsHandler(deps.ticketRepository, deps.eventRepository);

  return new Elysia({ prefix: "/api/v1/tickets" })
    .post(
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
    )
    .get(
      "/",
      async ({ query }) => {
        const result = await searchTicketsHandler.execute(
          new SearchTicketsQuery(query.ticketCode, query.eventId, query.status),
        );
        return success(result, "Tickets retrieved successfully");
      },
      {
        query: t.Object({
          ticketCode: t.Optional(t.String()),
          eventId: t.Optional(t.String()),
          status: t.Optional(t.String()),
        }),
        response: {
          200: SuccessResponse(t.Array(TicketSchema)),
        },
        detail: {
          summary: "Search Tickets",
          description: "Search tickets with optional filters",
          tags: ["Tickets"],
        },
      }
    )
    .get(
      "/:id",
      async ({ params }) => {
        const result = await getTicketHandler.execute(new GetTicketQuery(params.id));
        return success(result, "Ticket retrieved successfully");
      },
      {
        response: {
          200: SuccessResponse(TicketSchema),
        },
        detail: {
          summary: "Get Ticket Details",
          description: "Get detailed information about a ticket",
          tags: ["Tickets"],
        },
      }
    );
};
