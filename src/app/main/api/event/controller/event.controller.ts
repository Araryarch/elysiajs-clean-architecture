import { CreateEventCommand } from "./create-event.controller";
import { UpdateEventCommand } from "./update-event.controller";
import { DeleteEventCommand } from "./delete-event.controller";
import { PublishEventCommand } from "./publish-event.controller";
import { CancelEventCommand } from "./cancel-event.controller";
import { AddTicketCategoryCommand } from "./add-ticket-category.controller";
import { UpdateTicketCategoryCommand } from "./update-ticket-category.controller";
import { DisableTicketCategoryCommand } from "./disable-ticket-category.controller";
import { GetEventQuery } from "./get-event.controller";
import { ListEventsQuery } from "./list-events.controller";
import { GetSalesReportQuery } from "./get-sales-report.controller";
import { GetParticipantsQuery } from "./get-participants.controller";
import { GetEventAnalyticsQuery } from "./get-event-analytics.controller";
import { GetEventRevenueQuery } from "./get-event-revenue.controller";
import type { CreateEventHandler } from "./create-event.controller";
import type { UpdateEventHandler } from "./update-event.controller";
import type { DeleteEventHandler } from "./delete-event.controller";
import type { PublishEventHandler } from "./publish-event.controller";
import type { CancelEventHandler } from "./cancel-event.controller";
import type { AddTicketCategoryHandler } from "./add-ticket-category.controller";
import type { UpdateTicketCategoryHandler } from "./update-ticket-category.controller";
import type { DisableTicketCategoryHandler } from "./disable-ticket-category.controller";
import type { GetEventHandler } from "./get-event.controller";
import type { ListEventsHandler } from "./list-events.controller";
import type { GetSalesReportHandler } from "./get-sales-report.controller";
import type { GetParticipantsHandler } from "./get-participants.controller";
import type { GetEventAnalyticsHandler } from "./get-event-analytics.controller";
import type { GetEventRevenueHandler } from "./get-event-revenue.controller";
import { success } from "../../../shared/utils/response/response";

export type EventControllerHandlers = {
  createEventHandler: CreateEventHandler;
  updateEventHandler: UpdateEventHandler;
  deleteEventHandler: DeleteEventHandler;
  publishEventHandler: PublishEventHandler;
  cancelEventHandler: CancelEventHandler;
  addTicketCategoryHandler: AddTicketCategoryHandler;
  updateTicketCategoryHandler: UpdateTicketCategoryHandler;
  disableTicketCategoryHandler: DisableTicketCategoryHandler;
  getEventHandler: GetEventHandler;
  listEventsHandler: ListEventsHandler;
  getSalesReportHandler: GetSalesReportHandler;
  getParticipantsHandler: GetParticipantsHandler;
  getEventAnalyticsHandler: GetEventAnalyticsHandler;
  getEventRevenueHandler: GetEventRevenueHandler;
};

export const createEventController = (handlers: EventControllerHandlers) => ({
  create(body: { name: string; description?: string; venue: string; startAt: string; endAt: string; maxCapacity: number }) {
    const command = new CreateEventCommand(
      body.name,
      body.description || "",
      body.venue,
      new Date(body.startAt),
      new Date(body.endAt),
      body.maxCapacity,
      [],
    );
    return handlers.createEventHandler.execute(command).then((id) => success({ id }, "Event created successfully"));
  },

  list(query: { status?: string; location?: string; date?: string }) {
    return handlers.listEventsHandler.execute(new ListEventsQuery(query.status, query.location, query.date))
      .then((result) => success(result, "Events retrieved successfully"));
  },

  getById(params: { id: string }) {
    return handlers.getEventHandler.execute(new GetEventQuery(params.id))
      .then((result) => success(result, "Event retrieved successfully"));
  },

  publish(params: { id: string }) {
    return handlers.publishEventHandler.execute(new PublishEventCommand(params.id))
      .then(() => success(null, "Event published successfully"));
  },

  cancel(params: { id: string }) {
    return handlers.cancelEventHandler.execute(new CancelEventCommand(params.id))
      .then(() => success(null, "Event cancelled successfully"));
  },

  getSalesReport(params: { id: string }) {
    return handlers.getSalesReportHandler.execute(new GetSalesReportQuery(params.id))
      .then((result) => success(result, "Sales report retrieved successfully"));
  },

  getParticipants(params: { id: string }) {
    return handlers.getParticipantsHandler.execute(new GetParticipantsQuery(params.id))
      .then((result) => success(result, "Participants retrieved successfully"));
  },

  addTicketCategory(
    params: { id: string },
    body: { name: string; price: number; quota: number; salesStart: string; salesEnd: string },
  ) {
    const command = new AddTicketCategoryCommand(
      params.id,
      body.name,
      body.price,
      body.quota,
      new Date(body.salesStart),
      new Date(body.salesEnd),
    );
    return handlers.addTicketCategoryHandler.execute(command)
      .then((categoryId) => success({ id: categoryId }, "Ticket category added successfully"));
  },

  disableTicketCategory(params: { id: string; categoryId: string }) {
    return handlers.disableTicketCategoryHandler.execute(new DisableTicketCategoryCommand(params.id, params.categoryId))
      .then(() => success(null, "Ticket category disabled successfully"));
  },

  update(
    params: { id: string },
    body: { name?: string; description?: string; venue?: string; startAt?: string; endAt?: string; maxCapacity?: number },
  ) {
    const command = new UpdateEventCommand(
      params.id,
      body.name,
      body.description,
      body.venue,
      body.startAt ? new Date(body.startAt) : undefined,
      body.endAt ? new Date(body.endAt) : undefined,
      body.maxCapacity,
    );
    return handlers.updateEventHandler.execute(command)
      .then(() => success(null, "Event updated successfully"));
  },

  delete(params: { id: string }) {
    return handlers.deleteEventHandler.execute(new DeleteEventCommand(params.id))
      .then(() => success(null, "Event deleted successfully"));
  },

  updateTicketCategory(
    params: { id: string; categoryId: string },
    body: { name?: string; price?: number; quota?: number; salesStart?: string; salesEnd?: string },
  ) {
    const command = new UpdateTicketCategoryCommand(
      params.id,
      params.categoryId,
      body.name,
      body.price,
      body.quota,
      body.salesStart ? new Date(body.salesStart) : undefined,
      body.salesEnd ? new Date(body.salesEnd) : undefined,
    );
    return handlers.updateTicketCategoryHandler.execute(command)
      .then(() => success(null, "Ticket category updated successfully"));
  },

  getAnalytics(params: { id: string }) {
    return handlers.getEventAnalyticsHandler.execute(new GetEventAnalyticsQuery(params.id))
      .then((result) => success(result, "Event analytics retrieved successfully"));
  },

  getRevenue(params: { id: string }) {
    return handlers.getEventRevenueHandler.execute(new GetEventRevenueQuery(params.id))
      .then((result) => success(result, "Event revenue retrieved successfully"));
  },
});

export type EventController = ReturnType<typeof createEventController>;
