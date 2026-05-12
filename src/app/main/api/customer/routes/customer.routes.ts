import { Elysia, t } from "elysia";
import type { CustomerController } from "../controller/customer.controller";

export const createCustomerRoutes = (controller: CustomerController) =>
  new Elysia({ prefix: "/api/v1/customers/me" })
    .get("/bookings", ({ query }) => controller.getBookings(query), {
      query: t.Object({
        email: t.String({ format: "email" }),
      }),
    })
    .get("/tickets", ({ query }) => controller.getTickets(query), {
      query: t.Object({
        email: t.String({ format: "email" }),
      }),
    })
    .get("/refunds", ({ query }) => controller.getRefunds(query), {
      query: t.Object({
        email: t.String({ format: "email" }),
      }),
    });
