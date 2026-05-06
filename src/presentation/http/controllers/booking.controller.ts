import { Elysia, t } from "elysia";
import { CreateBookingCommand, CreateBookingHandler } from "@/application/commands/create-booking.command";
import { PayBookingCommand, PayBookingHandler } from "@/application/commands/pay-booking.command";
import { ExpireBookingCommand, ExpireBookingHandler } from "@/application/commands/expire-booking.command";
import { GetBookingQuery, GetBookingHandler } from "@/application/queries/get-booking.query";
import {
  GetTicketsByBookingQuery,
  GetTicketsByBookingHandler,
} from "@/application/queries/get-tickets.query";
import { EventRepository } from "@/domain/repositories/event-repository";
import { BookingRepository } from "@/domain/repositories/booking-repository";
import { ITicketRepository } from "@/domain/repositories/ticket-repository";
import { IPaymentGateway } from "@/application/services/interfaces";
import { success } from "@/presentation/http/response";

export const createBookingController = (deps: {
  eventRepository: EventRepository;
  bookingRepository: BookingRepository;
  ticketRepository: ITicketRepository;
  paymentGateway: IPaymentGateway;
}) => {
  const createBookingHandler = new CreateBookingHandler(deps.eventRepository, deps.bookingRepository);
  const payBookingHandler = new PayBookingHandler(
    deps.bookingRepository,
    deps.ticketRepository,
    deps.paymentGateway,
  );
  const expireBookingHandler = new ExpireBookingHandler(deps.bookingRepository, deps.eventRepository);
  const getBookingHandler = new GetBookingHandler(deps.bookingRepository, deps.eventRepository);
  const getTicketsHandler = new GetTicketsByBookingHandler(
    deps.bookingRepository,
    deps.ticketRepository,
    deps.eventRepository,
  );

  return new Elysia({ prefix: "/api/v1/bookings" })
    .post(
      "/",
      async ({ body }) => {
        // US8: Create Ticket Booking
        const command = new CreateBookingCommand(
          body.eventId,
          body.customerName,
          body.customerEmail,
          body.items,
        );
        const bookingId = await createBookingHandler.execute(command);
        return success({ id: bookingId }, "Booking created successfully");
      },
      {
        body: t.Object({
          eventId: t.String({ minLength: 1 }),
          customerName: t.String({ minLength: 1 }),
          customerEmail: t.String({ format: "email" }),
          items: t.Array(
            t.Object({
              ticketCategoryId: t.String({ minLength: 1 }),
              quantity: t.Number({ minimum: 1 }),
            }),
            { minItems: 1 },
          ),
        }),
      },
    )
    .get("/:id", async ({ params }) => {
      // Get booking details including total price (US9)
      const result = await getBookingHandler.execute(new GetBookingQuery(params.id));
      return success(result, "Booking retrieved successfully");
    })
    .post(
      "/:id/pay",
      async ({ params, body }) => {
        // US10: Pay Booking
        await payBookingHandler.execute(new PayBookingCommand(params.id, body.amount));
        return success(null, "Payment successful");
      },
      {
        body: t.Object({
          amount: t.Number({ minimum: 0 }),
        }),
      },
    )
    // NOTE: US11 (Expire Booking) should be handled by a background job/scheduler
    // This endpoint is for manual/admin testing purposes only
    .post("/:id/expire", async ({ params }) => {
      await expireBookingHandler.execute(new ExpireBookingCommand(params.id));
      return success(null, "Booking expired successfully");
    })
    // US12: View purchased tickets for a booking
    .get("/:id/tickets", async ({ params }) => {
      const result = await getTicketsHandler.execute(new GetTicketsByBookingQuery(params.id));
      return success(result, "Tickets retrieved successfully");
    });
};
