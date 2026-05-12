import { Elysia } from "elysia";
import type { PromoCodeController } from "../controller/promo-code.controller";

export const createPromoCodeRoutes = (controller: PromoCodeController) =>
  new Elysia()
    .post("/api/v1/events/:eventId/promo-codes", ({ params, body }) => controller.create(params, body))
    .get("/api/v1/events/:eventId/promo-codes", ({ params }) => controller.list(params))
    .post("/api/v1/promo-codes/validate", ({ body }) => controller.validate(body))
    .post("/api/v1/promo-codes/:id/deactivate", ({ params }) => controller.deactivate(params));
