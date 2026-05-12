import { Elysia, t } from "elysia";
import type { BookingController } from "../controller/booking.controller";

export const createBookingRoutes = (controller: BookingController) =>
  new Elysia({ prefix: "/api/v1/bookings" })
    .post("/", ({ body }) => controller.create(body), {
      body: t.Object({
        eventId: t.String(),
        customerName: t.String({ minLength: 1 }),
        customerEmail: t.String({ format: "email" }),
        items: t.Array(t.Object({
          ticketCategoryId: t.String(),
          quantity: t.Number({ minimum: 1 }),
        }), { minItems: 1 }),
      }),
    })
    .get("/", ({ query }) => controller.list(query), {
      query: t.Object({
        eventId: t.Optional(t.String()),
        status: t.Optional(t.String()),
        customerEmail: t.Optional(t.String()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    })
    .get("/:id", ({ params }) => controller.getById(params), {
      params: t.Object({
        id: t.String(),
      }),
    })
    .delete("/:id", ({ params }) => controller.cancel(params), {
      params: t.Object({
        id: t.String(),
      }),
    })
    .post("/:id/pay", ({ params, body }) => controller.pay(params, body), {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        amount: t.Number({ minimum: 0 }),
      }),
    })
    .post("/:id/expire", ({ params }) => controller.expire(params), {
      params: t.Object({
        id: t.String(),
      }),
    })
    .get("/:id/tickets", ({ params }) => controller.getTickets(params), {
      params: t.Object({
        id: t.String(),
      }),
    });
