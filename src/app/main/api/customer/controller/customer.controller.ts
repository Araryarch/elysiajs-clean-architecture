import { GetCustomerBookingsQuery } from "./get-customer-bookings.controller";
import { GetCustomerTicketsQuery } from "../../ticket/controller/get-customer-tickets.controller";
import { GetCustomerRefundsQuery } from "../../refund/controller/get-customer-refunds.controller";
import type { GetCustomerBookingsHandler } from "./get-customer-bookings.controller";
import type { GetCustomerTicketsHandler } from "../../ticket/controller/get-customer-tickets.controller";
import type { GetCustomerRefundsHandler } from "../../refund/controller/get-customer-refunds.controller";
import { success } from "../../../shared/utils/response/response";

export type CustomerControllerHandlers = {
  getCustomerBookingsHandler: GetCustomerBookingsHandler;
  getCustomerTicketsHandler: GetCustomerTicketsHandler;
  getCustomerRefundsHandler: GetCustomerRefundsHandler;
};

export const createCustomerController = (handlers: CustomerControllerHandlers) => ({
  getBookings(query: { email: string }) {
    if (!query.email) throw new Error("Email parameter is required");
    return handlers.getCustomerBookingsHandler.execute(new GetCustomerBookingsQuery(query.email))
      .then((result) => success(result, "Customer bookings retrieved successfully"));
  },

  getTickets(query: { email: string }) {
    if (!query.email) throw new Error("Email parameter is required");
    return handlers.getCustomerTicketsHandler.execute(new GetCustomerTicketsQuery(query.email))
      .then((result) => success(result, "Customer tickets retrieved successfully"));
  },

  getRefunds(query: { email: string }) {
    if (!query.email) throw new Error("Email parameter is required");
    return handlers.getCustomerRefundsHandler.execute(new GetCustomerRefundsQuery(query.email))
      .then((result) => success(result, "Customer refunds retrieved successfully"));
  },
});

export type CustomerController = ReturnType<typeof createCustomerController>;
