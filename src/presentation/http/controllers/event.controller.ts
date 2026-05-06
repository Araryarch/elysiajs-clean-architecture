import { Elysia, t, type TSchema } from "elysia";
import { CreateEventCommand, CreateEventHandler } from "@/application/commands/create-event.command";
import { PublishEventCommand, PublishEventHandler } from "@/application/commands/publish-event.command";
import { CancelEventCommand, CancelEventHandler } from "@/application/commands/cancel-event.command";
import {
  AddTicketCategoryCommand,
  AddTicketCategoryHandler,
} from "@/application/commands/add-ticket-category.command";
import {
  DisableTicketCategoryCommand,
  DisableTicketCategoryHandler,
} from "@/application/commands/disable-ticket-category.command";
import { GetEventQuery, GetEventHandler } from "@/application/queries/get-event.query";
import { ListEventsQuery, ListEventsHandler } from "@/application/queries/list-events.query";
import { GetSalesReportQuery, GetSalesReportHandler } from "@/application/queries/get-sales-report.query";
import { GetParticipantsQuery, GetParticipantsHandler } from "@/application/queries/get-participants.query";
import { EventRepository } from "@/domain/repositories/event-repository";
import { BookingRepository } from "@/domain/repositories/booking-repository";
import { ITicketRepository } from "@/domain/repositories/ticket-repository";
import { success } from "@/presentation/http/response";

const SuccessResponse = <T extends TSchema>(data: T) =>
  t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: data,
  });

const IdResponse = t.Object({ id: t.String() });
const NullResponse = t.Null();

export const createEventController = (deps: {
  eventRepository: EventRepository;
  bookingRepository: BookingRepository;
  ticketRepository: ITicketRepository;
}) => {
  const createEventHandler = new CreateEventHandler(deps.eventRepository);
  const publishEventHandler = new PublishEventHandler(deps.eventRepository);
  const cancelEventHandler = new CancelEventHandler(
    deps.eventRepository,
    deps.bookingRepository,
    deps.ticketRepository,
  );
  const addTicketCategoryHandler = new AddTicketCategoryHandler(deps.eventRepository);
  const disableTicketCategoryHandler = new DisableTicketCategoryHandler(deps.eventRepository);
  const getEventHandler = new GetEventHandler(deps.eventRepository);
  const listEventsHandler = new ListEventsHandler(deps.eventRepository);
  const getSalesReportHandler = new GetSalesReportHandler(deps.eventRepository, deps.bookingRepository);
  const getParticipantsHandler = new GetParticipantsHandler(
    deps.eventRepository,
    deps.bookingRepository,
    deps.ticketRepository,
  );

  const TicketCategorySchema = t.Object({
    id: t.String(),
    name: t.String(),
    price: t.Number(),
    currency: t.String(),
    quota: t.Number(),
    availableQuantity: t.Number(),
    salesStart: t.String(),
    salesEnd: t.String(),
    isActive: t.Boolean(),
  });

  const EventSchema = t.Object({
    id: t.String(),
    name: t.String(),
    description: t.Optional(t.String()),
    venue: t.String(),
    startAt: t.String(),
    endAt: t.String(),
    maxCapacity: t.Number(),
    status: t.String(),
    ticketCategories: t.Array(TicketCategorySchema),
  });

  const SalesReportSchema = t.Object({
    eventId: t.String(),
    eventName: t.String(),
    totalRevenue: t.Number(),
    categorySales: t.Array(
      t.Object({
        categoryName: t.String(),
        soldQuantity: t.Number(),
        revenue: t.Number(),
      })
    ),
    bookingStats: t.Object({
      pendingPayment: t.Number(),
      paid: t.Number(),
      expired: t.Number(),
      refunded: t.Number(),
    }),
  });

  const ParticipantSchema = t.Array(
    t.Object({
      customerName: t.String(),
      customerEmail: t.String(),
      ticketCategory: t.String(),
      ticketCode: t.String(),
      checkedIn: t.Boolean(),
    })
  );

  return new Elysia({ prefix: "/api/v1/events" })
    .post(
      "/",
      async ({ body }) => {
        const command = new CreateEventCommand(
          body.name,
          body.description || "",
          body.venue,
          new Date(body.startAt),
          new Date(body.endAt),
          body.maxCapacity,
          [],
        );
        const eventId = await createEventHandler.execute(command);
        return success({ id: eventId }, "Event created successfully");
      },
      {
        body: t.Object({
          name: t.String({ minLength: 1 }),
          description: t.Optional(t.String()),
          venue: t.String({ minLength: 1 }),
          startAt: t.String(),
          endAt: t.String(),
          maxCapacity: t.Number({ minimum: 1 }),
        }),
        response: {
          201: SuccessResponse(IdResponse),
        },
        detail: {
          summary: "Create Event",
          description: "Create a new event (Event Organizer only)",
          tags: ["Events"],
        },
      },
    )
    .get(
      "/",
      async ({ query }) => {
        const result = await listEventsHandler.execute(
          new ListEventsQuery(query.status, query.location, query.date),
        );
        return success(result, "Events retrieved successfully");
      },
      {
        query: t.Object({
          status: t.Optional(t.String()),
          location: t.Optional(t.String()),
          date: t.Optional(t.String()),
        }),
        response: {
          200: SuccessResponse(t.Array(EventSchema)),
        },
        detail: {
          summary: "List Events",
          description: "Get list of available events with optional filters",
          tags: ["Events"],
        },
      },
    )
    .get(
      "/:id",
      async ({ params }) => {
        const result = await getEventHandler.execute(new GetEventQuery(params.id));
        return success(result, "Event retrieved successfully");
      },
      {
        response: {
          200: SuccessResponse(EventSchema),
        },
        detail: {
          summary: "Get Event Details",
          description: "Get detailed information about a specific event",
          tags: ["Events"],
        },
      },
    )
    .post(
      "/:id/publish",
      async ({ params }) => {
        await publishEventHandler.execute(new PublishEventCommand(params.id));
        return success(null, "Event published successfully");
      },
      {
        response: {
          200: SuccessResponse(NullResponse),
        },
        detail: {
          summary: "Publish Event",
          description: "Publish an event to make it available for booking (Event Organizer only)",
          tags: ["Events"],
        },
      },
    )
    .post(
      "/:id/cancel",
      async ({ params }) => {
        await cancelEventHandler.execute(new CancelEventCommand(params.id));
        return success(null, "Event cancelled successfully");
      },
      {
        response: {
          200: SuccessResponse(NullResponse),
        },
        detail: {
          summary: "Cancel Event",
          description: "Cancel an event and process refunds (Event Organizer only)",
          tags: ["Events"],
        },
      },
    )
    .get(
      "/:id/sales-report",
      async ({ params }) => {
        const result = await getSalesReportHandler.execute(new GetSalesReportQuery(params.id));
        return success(result, "Sales report retrieved successfully");
      },
      {
        response: {
          200: SuccessResponse(SalesReportSchema),
        },
        detail: {
          summary: "Get Sales Report",
          description: "Get sales report for an event (Event Organizer only)",
          tags: ["Events"],
        },
      },
    )
    .get(
      "/:id/participants",
      async ({ params }) => {
        const result = await getParticipantsHandler.execute(new GetParticipantsQuery(params.id));
        return success(result, "Participants retrieved successfully");
      },
      {
        response: {
          200: SuccessResponse(ParticipantSchema),
        },
        detail: {
          summary: "Get Event Participants",
          description: "Get list of participants for an event (Event Organizer only)",
          tags: ["Events"],
        },
      },
    )
    .post(
      "/:id/ticket-categories",
      async ({ params, body }) => {
        const command = new AddTicketCategoryCommand(
          params.id,
          body.name,
          body.price,
          body.quota,
          new Date(body.salesStart),
          new Date(body.salesEnd),
        );
        const categoryId = await addTicketCategoryHandler.execute(command);
        return success({ id: categoryId }, "Ticket category added successfully");
      },
      {
        body: t.Object({
          name: t.String({ minLength: 1 }),
          price: t.Number({ minimum: 0 }),
          quota: t.Number({ minimum: 1 }),
          salesStart: t.String(),
          salesEnd: t.String(),
        }),
        response: {
          201: SuccessResponse(IdResponse),
        },
        detail: {
          summary: "Add Ticket Category",
          description: "Add a new ticket category to an event (Event Organizer only)",
          tags: ["Events"],
        },
      },
    )
    .post(
      "/:id/ticket-categories/:categoryId/disable",
      async ({ params }) => {
        await disableTicketCategoryHandler.execute(
          new DisableTicketCategoryCommand(params.id, params.categoryId),
        );
        return success(null, "Ticket category disabled successfully");
      },
      {
        response: {
          200: SuccessResponse(NullResponse),
        },
        detail: {
          summary: "Disable Ticket Category",
          description: "Disable a ticket category to prevent new bookings (Event Organizer only)",
          tags: ["Events"],
        },
      },
    );
};
