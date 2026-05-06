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
        detail: {
          summary: "Create Booking",
          description: "Create a new ticket booking",
          tags: ["Bookings"],
          responses: {
            200: {
              description: "Booking created successfully",
              content: {
                "application/json": {
                  example: {
                    success: true,
                    message: "Booking created successfully",
                    data: {
                      id: "bkg_abc123xyz"
                    }
                  }
                }
              }
            }
          }
        }
      },
    )
    .get(
      "/:id",
      async ({ params }) => {
        const result = await getBookingHandler.execute(new GetBookingQuery(params.id));
        return success(result, "Booking retrieved successfully");
      },
      {
        detail: {
          summary: "Get Booking Details",
          description: "Get detailed information about a booking",
          tags: ["Bookings"],
          responses: {
            200: {
              description: "Booking retrieved successfully",
              content: {
                "application/json": {
                  example: {
                    success: true,
                    message: "Booking retrieved successfully",
                    data: {
                      id: "bkg_abc123xyz",
                      eventId: "evt_xyz789",
                      customerName: "John Doe",
                      customerEmail: "john@example.com",
                      items: [
                        {
                          ticketCategoryId: "cat_early123",
                          ticketCategoryName: "Early Bird",
                          quantity: 2,
                          unitPrice: 500000
                        }
                      ],
                      totalAmount: 1000000,
                      currency: "IDR",
                      status: "PendingPayment",
                      paymentDeadline: "2026-05-07T10:30:00Z",
                      createdAt: "2026-05-07T10:15:00Z"
                    }
                  }
                }
              }
            }
          }
        }
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
        detail: {
          summary: "Pay Booking",
          description: "Process payment for a booking",
          tags: ["Bookings"],
          responses: {
            200: {
              description: "Payment successful",
              content: {
                "application/json": {
                  example: {
                    success: true,
                    message: "Payment successful",
                    data: null
                  }
                }
              }
            }
          }
        }
      },
    )
    .post(
      "/:id/expire",
      async ({ params }) => {
        await expireBookingHandler.execute(new ExpireBookingCommand(params.id));
        return success(null, "Booking expired successfully");
      },
      {
        detail: {
          summary: "Expire Booking",
          description: "Expire a booking (admin only)",
          tags: ["Bookings"],
          responses: {
            200: {
              description: "Booking expired successfully",
              content: {
                "application/json": {
                  example: {
                    success: true,
                    message: "Booking expired successfully",
                    data: null
                  }
                }
              }
            }
          }
        }
      },
    )
    .get(
      "/:id/tickets",
      async ({ params }) => {
        const result = await getTicketsHandler.execute(new GetTicketsByBookingQuery(params.id));
        return success(result, "Tickets retrieved successfully");
      },
      {
        detail: {
          summary: "Get Booking Tickets",
          description: "Get all tickets for a booking",
          tags: ["Bookings"],
          responses: {
            200: {
              description: "Tickets retrieved successfully",
              content: {
                "application/json": {
                  example: {
                    success: true,
                    message: "Tickets retrieved successfully",
                    data: [
                      {
                        id: "tkt_ticket001",
                        ticketCode: "TKT-ABC-123456",
                        eventName: "Tech Conference 2026",
                        categoryName: "Early Bird",
                        customerName: "John Doe",
                        status: "Active",
                        issuedAt: "2026-05-07T10:15:00Z"
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      },
    );
};
