import { Elysia } from "elysia";
import type { DashboardController } from "../controller/dashboard.controller";

export const createDashboardRoutes = (controller: DashboardController) =>
  new Elysia({ prefix: "/api/v1/dashboard" })
    .get("/stats", () => controller.getStats());
