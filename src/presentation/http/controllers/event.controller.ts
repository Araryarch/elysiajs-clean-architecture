import { Elysia, t } from "elysia";
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

  return new Elysia({ prefix: "/api/v1/events" })
    .post(
      "/",
      async ({ body }) => {
        // US1: Create Event - should NOT include ticket categories on creation
        // Ticket categories should be added separately via US4
        const command = new CreateEventCommand(
          body.name,
          body.description || "",
          body.venue,
          new Date(body.startAt),
          new Date(body.endAt),
          body.maxCapacity,
          [], // Empty ticket categories - should be added via separate endpoint
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
      },
    )
    .get(
      "/",
      async ({ query }) => {
        // US6: View Available Events - with proper filtering
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
      },
    )
    .get("/:id", async ({ params }) => {
      // US7: View Event Details
      const result = await getEventHandler.execute(new GetEventQuery(params.id));
      return success(result, "Event retrieved successfully");
    })
    .post("/:id/publish", async ({ params }) => {
      // US2: Publish Event (Event Organizer only)
      await publishEventHandler.execute(new PublishEventCommand(params.id));
      return success(null, "Event published successfully");
    })
    .post("/:id/cancel", async ({ params }) => {
      // US3: Cancel Event (Event Organizer only)
      await cancelEventHandler.execute(new CancelEventCommand(params.id));
      return success(null, "Event cancelled successfully");
    })
    .get("/:id/sales-report", async ({ params }) => {
      // US19: View Event Sales Report (Event Organizer only)
      const result = await getSalesReportHandler.execute(new GetSalesReportQuery(params.id));
      return success(result, "Sales report retrieved successfully");
    })
    .get("/:id/participants", async ({ params }) => {
      // US20: View Event Participants (Event Organizer only)
      const result = await getParticipantsHandler.execute(new GetParticipantsQuery(params.id));
      return success(result, "Participants retrieved successfully");
    })
    // US4: Create Ticket Category (Event Organizer only)
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
      },
    )
    // US5: Disable Ticket Category (Event Organizer only)
    .post("/:id/ticket-categories/:categoryId/disable", async ({ params }) => {
      await disableTicketCategoryHandler.execute(
        new DisableTicketCategoryCommand(params.id, params.categoryId),
      );
      return success(null, "Ticket category disabled successfully");
    });
};
