import { Elysia } from "elysia";
import type { RefundController } from "../controller/refund.controller";

export const createRefundRoutes = (controller: RefundController) =>
  new Elysia({ prefix: "/api/v1/refunds" })
    .post("/", ({ body }) => controller.request(body))
    .get("/", ({ query }) => controller.list(query))
    .get("/:id", ({ params }) => controller.getById(params))
    .post("/:id/approve", ({ params }) => controller.approve(params))
    .post("/:id/reject", ({ params }) => controller.reject(params))
    .post("/:id/payout", ({ params }) => controller.payout(params));
