import { Elysia, t } from "elysia";
import type { RefundController } from "../controller/refund.controller";

export const createRefundRoutes = (controller: RefundController) =>
  new Elysia({ prefix: "/api/v1/refunds" })
    .post("/", ({ body }) => controller.request(body), {
      body: t.Object({
        bookingId: t.String(),
      }),
    })
    .get("/", ({ query }) => controller.list(query), {
      query: t.Object({
        status: t.Optional(t.String()),
        bookingId: t.Optional(t.String()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    })
    .get("/:id", ({ params }) => controller.getById(params), {
      params: t.Object({
        id: t.String(),
      }),
    })
    .post("/:id/approve", ({ params }) => controller.approve(params), {
      params: t.Object({
        id: t.String(),
      }),
    })
    .post(
      "/:id/reject",
      ({ params, body }) => controller.reject(params, body ?? undefined),
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Optional(
          t.Object({
            reason: t.Optional(t.String()),
          }),
        ),
      },
    )
    .post("/:id/payout", ({ params }) => controller.payout(params), {
      params: t.Object({
        id: t.String(),
      }),
    });
