import { Elysia } from "elysia";
import type { EventController } from "../controller/event.controller";

export const createEventRoutes = (controller: EventController) =>
  new Elysia({ prefix: "/api/v1/events" })
    .post("/", ({ body }) => controller.create(body))
    .get("/", ({ query }) => controller.list(query))
    .get("/:id", ({ params }) => controller.getById(params))
    .put("/:id", ({ params, body }) => controller.update(params, body))
    .delete("/:id", ({ params }) => controller.delete(params))
    .post("/:id/publish", ({ params }) => controller.publish(params))
    .post("/:id/cancel", ({ params }) => controller.cancel(params))
    .get("/:id/sales-report", ({ params }) => controller.getSalesReport(params))
    .get("/:id/participants", ({ params }) => controller.getParticipants(params))
    .get("/:id/analytics", ({ params }) => controller.getAnalytics(params))
    .get("/:id/revenue", ({ params }) => controller.getRevenue(params))
    .post("/:id/ticket-categories", ({ params, body }) => controller.addTicketCategory(params, body))
    .put("/:id/ticket-categories/:categoryId", ({ params, body }) => controller.updateTicketCategory(params, body))
    .post("/:id/ticket-categories/:categoryId/disable", ({ params }) => controller.disableTicketCategory(params));
