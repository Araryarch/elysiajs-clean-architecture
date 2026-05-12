import { CreateBookingCommand } from "./create-booking.controller";
import { CancelBookingCommand } from "./cancel-booking.controller";
import { PayBookingCommand } from "./pay-booking.controller";
import { ExpireBookingCommand } from "./expire-booking.controller";
import { GetBookingQuery } from "./get-booking.controller";
import { ListBookingsQuery } from "./list-bookings.controller";
import { GetTicketsByBookingQuery } from "./get-tickets.controller";
import type { CreateBookingHandler } from "./create-booking.controller";
import type { CancelBookingHandler } from "./cancel-booking.controller";
import type { PayBookingHandler } from "./pay-booking.controller";
import type { ExpireBookingHandler } from "./expire-booking.controller";
import type { GetBookingHandler } from "./get-booking.controller";
import type { ListBookingsHandler } from "./list-bookings.controller";
import type { GetTicketsByBookingHandler } from "./get-tickets.controller";
import { success } from "../../../middlewares/response/response";

export type BookingControllerHandlers = {
  createBookingHandler: CreateBookingHandler;
  cancelBookingHandler: CancelBookingHandler;
  payBookingHandler: PayBookingHandler;
  expireBookingHandler: ExpireBookingHandler;
  getBookingHandler: GetBookingHandler;
  listBookingsHandler: ListBookingsHandler;
  getTicketsHandler: GetTicketsByBookingHandler;
};

export const createBookingController = (
  handlers: BookingControllerHandlers,
) => ({
  create(body: {
    eventId: string;
    customerName: string;
    customerEmail: string;
    items: Array<{ ticketCategoryId: string; quantity: number }>;
  }) {
    const command = new CreateBookingCommand(
      body.eventId,
      body.customerName,
      body.customerEmail,
      body.items,
    );
    return handlers.createBookingHandler
      .execute(command)
      .then((id) => success({ id }, "Booking created successfully"));
  },

  getById(params: { id: string }) {
    return handlers.getBookingHandler
      .execute(new GetBookingQuery(params.id))
      .then((result) => success(result, "Booking retrieved successfully"));
  },

  pay(params: { id: string }, body: { amount: number }) {
    return handlers.payBookingHandler
      .execute(new PayBookingCommand(params.id, body.amount))
      .then(() => success(null, "Payment successful"));
  },

  expire(params: { id: string }) {
    return handlers.expireBookingHandler
      .execute(new ExpireBookingCommand(params.id))
      .then(() => success(null, "Booking expired successfully"));
  },

  getTickets(params: { id: string }) {
    return handlers.getTicketsHandler
      .execute(new GetTicketsByBookingQuery(params.id))
      .then((result) => success(result, "Tickets retrieved successfully"));
  },

  list(query: {
    eventId?: string;
    status?: string;
    customerEmail?: string;
    page?: string;
    limit?: string;
  }) {
    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 10;
    return handlers.listBookingsHandler
      .execute(
        new ListBookingsQuery(
          query.eventId,
          query.status,
          query.customerEmail,
          page,
          limit,
        ),
      )
      .then((result) => success(result, "Bookings retrieved successfully"));
  },

  cancel(params: { id: string }) {
    return handlers.cancelBookingHandler
      .execute(new CancelBookingCommand(params.id))
      .then(() => success(null, "Booking cancelled successfully"));
  },
});

export type BookingController = ReturnType<typeof createBookingController>;
