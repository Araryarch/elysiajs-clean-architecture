import { Elysia, t } from "elysia";
import { CreateEventCommand, CreateEventHandler } from "@/application/commands/create-event.command";
import { PublishEventCommand, PublishEventHandler } from "@/application/commands/publish-event.command";
import { CancelEventCommand, CancelEventHandler } from "@/application/commands/cancel-event.command";
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
  const cancelEventHandler = new CancelEventHandler(deps.eventRepository, deps.bookingRepository);
  const getEventHandler = new GetEventHandler(deps.eventRepository);
  const listEventsHandler = new ListEventsHandler(deps.eventRepository);
  const getSalesReportHandler = new GetSalesReportHandler(deps.eventRepository, deps.bookingRepository);
  const getParticipantsHandler = new GetParticipantsHandler(
    deps.eventRepository,
    deps.bookingRepository,
    deps.ticketRepository
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
          body.ticketCategories.map((cat) => ({
            name: cat.name,
            price: cat.price,
            quota: cat.quota,
            salesStart: new Date(cat.salesStart),
            salesEnd: new Date(cat.salesEnd),
          }))
        );
        const eventId = await createEventHandler.execute(command);
        return success({ id: eventId }, "Event created successfully");
      },
      {
        body: t.Object({
          name: t.String(),
          description: t.Optional(t.String()),
          venue: t.String(),
          startAt: t.String(),
          endAt: t.String(),
          maxCapacity: t.Number(),
          ticketCategories: t.Array(
            t.Object({
              name: t.String(),
              price: t.Number(),
              quota: t.Number(),
              salesStart: t.String(),
              salesEnd: t.String(),
            })
          ),
        }),
      }
    )
    .get("/", async ({ query }) => {
      const result = await listEventsHandler.execute(
        new ListEventsQuery(query.status, query.location)
      );
      return success(result, "Events retrieved successfully");
    })
    .get("/:id", async ({ params }) => {
      const result = await getEventHandler.execute(new GetEventQuery(params.id));
      return success(result, "Event retrieved successfully");
    })
    .post("/:id/publish", async ({ params }) => {
      await publishEventHandler.execute(new PublishEventCommand(params.id));
      return success(null, "Event published successfully");
    })
    .post("/:id/cancel", async ({ params }) => {
      await cancelEventHandler.execute(new CancelEventCommand(params.id));
      return success(null, "Event cancelled successfully");
    })
    .get("/:id/sales-report", async ({ params }) => {
      const result = await getSalesReportHandler.execute(new GetSalesReportQuery(params.id));
      return success(result, "Sales report retrieved successfully");
    })
    .get("/:id/participants", async ({ params }) => {
      const result = await getParticipantsHandler.execute(new GetParticipantsQuery(params.id));
      return success(result, "Participants retrieved successfully");
    });
};
