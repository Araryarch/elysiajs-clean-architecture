import { Elysia, t } from "elysia";
import { CreateBookingCommand, CreateBookingHandler } from "@/application/commands/create-booking.command";
import { PayBookingCommand, PayBookingHandler } from "@/application/commands/pay-booking.command";
import { GetBookingQuery, GetBookingHandler } from "@/application/queries/get-booking.query";
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
    deps.paymentGateway
  );
  const getBookingHandler = new GetBookingHandler(deps.bookingRepository, deps.eventRepository);

  return new Elysia({ prefix: "/api/v1/bookings" })
    .post(
      "/",
      async ({ body }) => {
        const command = new CreateBookingCommand(
          body.eventId,
          body.customerName,
          body.customerEmail,
          body.items
        );
        const bookingId = await createBookingHandler.execute(command);
        return success({ id: bookingId }, "Booking created successfully");
      },
      {
        body: t.Object({
          eventId: t.String(),
          customerName: t.String(),
          customerEmail: t.String(),
          items: t.Array(
            t.Object({
              ticketCategoryId: t.String(),
              quantity: t.Number(),
            })
          ),
        }),
      }
    )
    .get("/:id", async ({ params }) => {
      const result = await getBookingHandler.execute(new GetBookingQuery(params.id));
      return success(result, "Booking retrieved successfully");
    })
    .post(
      "/:id/pay",
      async ({ params, body }) => {
        await payBookingHandler.execute(new PayBookingCommand(params.id, body.amount));
        return success(null, "Payment successful");
      },
      {
        body: t.Object({
          amount: t.Number(),
        }),
      }
    );
};
