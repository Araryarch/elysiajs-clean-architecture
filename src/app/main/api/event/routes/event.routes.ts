import { Elysia, t } from "elysia";
import type { EventController } from "../controller/event.controller";

export const createEventRoutes = (controller: EventController) =>
  new Elysia({ prefix: "/api/v1/events" })
    .post("/", ({ body }) => controller.create(body), {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        venue: t.String({ minLength: 1 }),
        startAt: t.String({ format: "date-time" }),
        endAt: t.String({ format: "date-time" }),
        maxCapacity: t.Number({ minimum: 1 }),
      }),
    })
    .get("/", ({ query }) => controller.list(query), {
      query: t.Object({
        status: t.Optional(t.String()),
        location: t.Optional(t.String()),
        date: t.Optional(t.String()),
      }),
    })
    .get("/:id", ({ params }) => controller.getById(params), {
      params: t.Object({
        id: t.String(),
      }),
    })
    .put("/:id", ({ params, body }) => controller.update(params, body), {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
        description: t.Optional(t.String()),
        venue: t.Optional(t.String({ minLength: 1 })),
        startAt: t.Optional(t.String({ format: "date-time" })),
        endAt: t.Optional(t.String({ format: "date-time" })),
        maxCapacity: t.Optional(t.Number({ minimum: 1 })),
      }),
    })
    .delete("/:id", ({ params }) => controller.delete(params), {
      params: t.Object({
        id: t.String(),
      }),
    })
    .post("/:id/publish", ({ params }) => controller.publish(params), {
      params: t.Object({
        id: t.String(),
      }),
    })
    .post("/:id/cancel", ({ params }) => controller.cancel(params), {
      params: t.Object({
        id: t.String(),
      }),
    })
    .get(
      "/:id/sales-report",
      ({ params }) => controller.getSalesReport(params),
      {
        params: t.Object({
          id: t.String(),
        }),
      },
    )
    .get(
      "/:id/participants",
      ({ params }) => controller.getParticipants(params),
      {
        params: t.Object({
          id: t.String(),
        }),
      },
    )
    .get("/:id/analytics", ({ params }) => controller.getAnalytics(params), {
      params: t.Object({
        id: t.String(),
      }),
    })
    .get("/:id/revenue", ({ params }) => controller.getRevenue(params), {
      params: t.Object({
        id: t.String(),
      }),
    })
    .post(
      "/:id/ticket-categories",
      ({ params, body }) => controller.addTicketCategory(params, body),
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          name: t.String({ minLength: 1 }),
          price: t.Number({ minimum: 0 }),
          quota: t.Number({ minimum: 1 }),
          salesStart: t.String({ format: "date-time" }),
          salesEnd: t.String({ format: "date-time" }),
        }),
      },
    )
    .put(
      "/:id/ticket-categories/:categoryId",
      ({ params, body }) => controller.updateTicketCategory(params, body),
      {
        params: t.Object({
          id: t.String(),
          categoryId: t.String(),
        }),
        body: t.Object({
          name: t.Optional(t.String({ minLength: 1 })),
          price: t.Optional(t.Number({ minimum: 0 })),
          quota: t.Optional(t.Number({ minimum: 1 })),
          salesStart: t.Optional(t.String({ format: "date-time" })),
          salesEnd: t.Optional(t.String({ format: "date-time" })),
        }),
      },
    )
    .post(
      "/:id/ticket-categories/:categoryId/disable",
      ({ params }) => controller.disableTicketCategory(params),
      {
        params: t.Object({
          id: t.String(),
          categoryId: t.String(),
        }),
      },
    );
