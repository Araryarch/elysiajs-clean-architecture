import { GetDashboardStatsQuery } from "./get-dashboard-stats.controller";
import type { GetDashboardStatsHandler } from "./get-dashboard-stats.controller";
import { success } from "../../../middlewares/response/response";

export type DashboardControllerHandlers = {
  getDashboardStatsHandler: GetDashboardStatsHandler;
};

export const createDashboardController = (
  handlers: DashboardControllerHandlers,
) => ({
  getStats() {
    return handlers.getDashboardStatsHandler
      .execute()
      .then((result) =>
        success(result, "Dashboard stats retrieved successfully"),
      );
  },
});

export type DashboardController = ReturnType<typeof createDashboardController>;
