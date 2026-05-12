import { Elysia, t } from "elysia";
import type { TicketController } from "../controller/ticket.controller";

export const createTicketRoutes = (controller: TicketController) =>
  new Elysia({ prefix: "/api/v1/tickets" })
    .get("/", ({ query }) => controller.search(query), {
      query: t.Object({
        ticketCode: t.Optional(t.String()),
        eventId: t.Optional(t.String()),
        status: t.Optional(t.String()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    })
    .get("/:id", ({ params }) => controller.getById(params), {
      params: t.Object({
        id: t.String(),
      }),
    })
    .post("/check-in", ({ body }) => controller.checkIn(body), {
      body: t.Object({
        ticketCode: t.String({ minLength: 1 }),
        eventId: t.String(),
      }),
    });
