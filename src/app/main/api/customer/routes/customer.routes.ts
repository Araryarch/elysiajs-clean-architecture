import { Elysia } from "elysia";
import type { CustomerController } from "../controller/customer.controller";

export const createCustomerRoutes = (controller: CustomerController) =>
  new Elysia({ prefix: "/api/v1/customers/me" })
    .get("/bookings", ({ query }) => controller.getBookings(query))
    .get("/tickets", ({ query }) => controller.getTickets(query))
    .get("/refunds", ({ query }) => controller.getRefunds(query));
