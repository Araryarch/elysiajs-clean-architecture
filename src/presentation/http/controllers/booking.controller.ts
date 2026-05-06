import { Elysia, t, type TSchema } from "elysia";
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

const SuccessResponse = <T extends TSchema>(data: T) =>
  t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: data,
  });

const IdResponse = t.Object({ id: t.String() });
const NullResponse = t.Null();

const BookingItemSchema = t.Object({
  ticketCategoryId: t.String(),
  ticketCategoryName: t.String(),
  quantity: t.Number(),
  unitPrice: t.Number(),
});

const BookingSchema = t.Object({
  id: t.String(),
  eventId: t.String(),
  customerName: t.String(),
  customerEmail: t.String(),
  items: t.Array(BookingItemSchema),
  totalAmount: t.Number(),
  currency: t.String(),
  status: t.String(),
  paymentDeadline: t.String(),
  createdAt: t.String(),
  paidAt: t.Optional(t.String()),
});

const TicketSchema = t.Object({
  id: t.String(),
  ticketCode: t.String(),
  eventName: t.String(),
  categoryName: t.String(),
  customerName: t.String(),
  status: t.String(),
  issuedAt: t.String(),
});

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
        response: {
          201: SuccessResponse(IdResponse),
        },
        detail: {
          summary: "Create Booking",
          description: "Create a new ticket booking",
          tags: ["Bookings"],
        },
      },
    )
    .get(
      "/:id",
      async ({ params }) => {
        const result = await getBookingHandler.execute(new GetBookingQuery(params.id));
        return success(result, "Booking retrieved successfully");
      },
      {
        response: {
          200: SuccessResponse(BookingSchema),
        },
        detail: {
          summary: "Get Booking Details",
          description: "Get detailed information about a booking",
          tags: ["Bookings"],
        },
      },
    )
    .post(
      "/:id/pay",
      async ({ params, body }) => {
        await payBookingHandler.execute(new PayBookingCommand(params.id, body.amount));
        return success(null, "Payment successful");
      },
      {
        body: t.Object({
          amount: t.Number({ minimum: 0 }),
        }),
        response: {
          200: SuccessResponse(NullResponse),
        },
        detail: {
          summary: "Pay Booking",
          description: "Process payment for a booking",
          tags: ["Bookings"],
        },
      },
    )
    .post(
      "/:id/expire",
      async ({ params }) => {
        await expireBookingHandler.execute(new ExpireBookingCommand(params.id));
        return success(null, "Booking expired successfully");
      },
      {
        response: {
          200: SuccessResponse(NullResponse),
        },
        detail: {
          summary: "Expire Booking",
          description: "Expire a booking (admin only)",
          tags: ["Bookings"],
        },
      },
    )
    .get(
      "/:id/tickets",
      async ({ params }) => {
        const result = await getTicketsHandler.execute(new GetTicketsByBookingQuery(params.id));
        return success(result, "Tickets retrieved successfully");
      },
      {
        response: {
          200: SuccessResponse(t.Array(TicketSchema)),
        },
        detail: {
          summary: "Get Booking Tickets",
          description: "Get all tickets for a booking",
          tags: ["Bookings"],
        },
      },
    );
};
