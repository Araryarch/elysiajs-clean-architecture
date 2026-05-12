import { Elysia } from "elysia";
import type { TicketController } from "../controller/ticket.controller";

export const createTicketRoutes = (controller: TicketController) =>
  new Elysia({ prefix: "/api/v1/tickets" })
    .get("/", ({ query }) => controller.search(query))
    .get("/:id", ({ params }) => controller.getById(params))
    .post("/check-in", ({ body }) => controller.checkIn(body));
