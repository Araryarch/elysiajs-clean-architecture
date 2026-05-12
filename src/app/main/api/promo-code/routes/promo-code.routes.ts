import { Elysia, t } from "elysia";
import type { PromoCodeController } from "../controller/promo-code.controller";

export const createPromoCodeRoutes = (controller: PromoCodeController) =>
  new Elysia()
    .post(
      "/api/v1/events/:id/promo-codes",
      ({ params, body }) => controller.create(params, body),
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          code: t.String({ minLength: 1 }),
          type: t.Union([t.Literal("Percentage"), t.Literal("FixedAmount")]),
          discountValue: t.Number({ minimum: 0 }),
          maxUsage: t.Number({ minimum: 1 }),
          validStart: t.String({ format: "date-time" }),
          validEnd: t.String({ format: "date-time" }),
          minPurchaseAmount: t.Optional(t.Number({ minimum: 0 })),
        }),
      },
    )
    .get(
      "/api/v1/events/:id/promo-codes",
      ({ params }) => controller.list(params),
      {
        params: t.Object({
          id: t.String(),
        }),
      },
    )
    .post(
      "/api/v1/promo-codes/validate",
      ({ body }) => controller.validate(body),
      {
        body: t.Object({
          eventId: t.String(),
          code: t.String({ minLength: 1 }),
          purchaseAmount: t.Number({ minimum: 0 }),
        }),
      },
    )
    .post(
      "/api/v1/promo-codes/:id/deactivate",
      ({ params }) => controller.deactivate(params),
      {
        params: t.Object({
          id: t.String(),
        }),
      },
    );
