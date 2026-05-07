import { Elysia, t, type TSchema } from "elysia";
import { GetCustomerBookingsQuery, GetCustomerBookingsHandler } from "@/app/main/controllers/customer/get-customer-bookings.query";
import { GetCustomerTicketsQuery, GetCustomerTicketsHandler } from "@/app/main/controllers/ticket/get-customer-tickets.query";
import { GetCustomerRefundsQuery, GetCustomerRefundsHandler } from "@/app/main/controllers/refund/get-customer-refunds.query";
import { EventRepository } from "@/app/main/repositories/event/event-repository";
import { BookingRepository } from "@/app/main/repositories/booking/booking-repository";
import { ITicketRepository } from "@/app/main/repositories/ticket/ticket-repository";
import { IRefundRepository } from "@/app/main/repositories/refund/refund-repository";
import { success } from "@/app/main/shared/utils/response/response";

const SuccessResponse = <T extends TSchema>(data: T) =>
  t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: data,
  });

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
  checkedInAt: t.Optional(t.String()),
});

const RefundSchema = t.Object({
  id: t.String(),
  bookingId: t.String(),
  amount: t.Number(),
  currency: t.String(),
  status: t.String(),
  requestedAt: t.String(),
  approvedAt: t.Optional(t.String()),
  rejectedAt: t.Optional(t.String()),
  paidOutAt: t.Optional(t.String()),
  rejectionReason: t.Optional(t.String()),
  paymentReference: t.Optional(t.String()),
});

export const createCustomerController = (deps: {
  eventRepository: EventRepository;
  bookingRepository: BookingRepository;
  ticketRepository: ITicketRepository;
  refundRepository: IRefundRepository;
}) => {
  const getCustomerBookingsHandler = new GetCustomerBookingsHandler(
    deps.bookingRepository,
    deps.eventRepository,
  );
  const getCustomerTicketsHandler = new GetCustomerTicketsHandler(
    deps.ticketRepository,
    deps.eventRepository,
    deps.bookingRepository,
  );
  const getCustomerRefundsHandler = new GetCustomerRefundsHandler(
    deps.refundRepository,
    deps.bookingRepository,
  );

  return new Elysia({ prefix: "/api/v1/customers/me" })
    .get(
      "/bookings",
      async ({ query }) => {
        if (!query.email) {
          throw new Error("Email parameter is required");
        }
        const result = await getCustomerBookingsHandler.execute(
          new GetCustomerBookingsQuery(query.email),
        );
        return success(result, "Customer bookings retrieved successfully");
      },
      {
        query: t.Object({
          email: t.String({ format: "email" }),
        }),
        response: {
          200: SuccessResponse(t.Array(BookingSchema)),
        },
        detail: {
          summary: "Get Customer Bookings",
          description: "Get all bookings for a customer by email",
          tags: ["Customers"],
        },
      },
    )
    .get(
      "/tickets",
      async ({ query }) => {
        if (!query.email) {
          throw new Error("Email parameter is required");
        }
        const result = await getCustomerTicketsHandler.execute(
          new GetCustomerTicketsQuery(query.email),
        );
        return success(result, "Customer tickets retrieved successfully");
      },
      {
        query: t.Object({
          email: t.String({ format: "email" }),
        }),
        response: {
          200: SuccessResponse(t.Array(TicketSchema)),
        },
        detail: {
          summary: "Get Customer Tickets",
          description: "Get all tickets for a customer by email",
          tags: ["Customers"],
        },
      },
    )
    .get(
      "/refunds",
      async ({ query }) => {
        if (!query.email) {
          throw new Error("Email parameter is required");
        }
        const result = await getCustomerRefundsHandler.execute(
          new GetCustomerRefundsQuery(query.email),
        );
        return success(result, "Customer refunds retrieved successfully");
      },
      {
        query: t.Object({
          email: t.String({ format: "email" }),
        }),
        response: {
          200: SuccessResponse(t.Array(RefundSchema)),
        },
        detail: {
          summary: "Get Customer Refunds",
          description: "Get all refund requests for a customer by email",
          tags: ["Customers"],
        },
      },
    );
};
