import { CheckInTicketCommand } from "./check-in-ticket.controller";
import { GetTicketQuery } from "./get-ticket.controller";
import { SearchTicketsQuery } from "./search-tickets.controller";
import type { CheckInTicketHandler } from "./check-in-ticket.controller";
import type { GetTicketHandler } from "./get-ticket.controller";
import type { SearchTicketsHandler } from "./search-tickets.controller";
import { success } from "../../../shared/utils/response/response";

export type TicketControllerHandlers = {
  checkInHandler: CheckInTicketHandler;
  getTicketHandler: GetTicketHandler;
  searchTicketsHandler: SearchTicketsHandler;
};

export const createTicketController = (handlers: TicketControllerHandlers) => ({
  checkIn(body: { ticketCode: string; eventId: string }) {
    return handlers.checkInHandler.execute(new CheckInTicketCommand(body.ticketCode, body.eventId))
      .then(() => success(null, "Ticket checked in successfully"));
  },

  search(query: { ticketCode?: string; eventId?: string; status?: string; page?: string; limit?: string }) {
    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 10;
    return handlers.searchTicketsHandler.execute(new SearchTicketsQuery(query.ticketCode, query.eventId, query.status, page, limit))
      .then((result) => success(result, "Tickets retrieved successfully"));
  },

  getById(params: { id: string }) {
    return handlers.getTicketHandler.execute(new GetTicketQuery(params.id))
      .then((result) => success(result, "Ticket retrieved successfully"));
  },
});

export type TicketController = ReturnType<typeof createTicketController>;
