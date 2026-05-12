import { Elysia } from "elysia";
import type { BookingController } from "../controller/booking.controller";

export const createBookingRoutes = (controller: BookingController) =>
  new Elysia({ prefix: "/api/v1/bookings" })
    .post("/", ({ body }) => controller.create(body))
    .get("/", ({ query }) => controller.list(query))
    .get("/:id", ({ params }) => controller.getById(params))
    .delete("/:id", ({ params }) => controller.cancel(params))
    .post("/:id/pay", ({ params, body }) => controller.pay(params, body))
    .post("/:id/expire", ({ params }) => controller.expire(params))
    .get("/:id/tickets", ({ params }) => controller.getTickets(params));
