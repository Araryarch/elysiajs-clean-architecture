import swagger from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { PostgresEventRepository } from "./api/event/repository/postgres-event.repository";
import { PostgresBookingRepository } from "./api/booking/repository/postgres-booking.repository";
import { PostgresTicketRepository } from "./api/ticket/repository/postgres-ticket.repository";
import { PostgresRefundRepository } from "./api/refund/repository/postgres-refund.repository";
import { PostgresPromoCodeRepository } from "./api/promo-code/repository/postgres-promo-code.repository";
import { PostgresUserRepository } from "./api/auth/repository/postgres-user.repository";
import { createMockPaymentGateway } from "./api/booking/service/mock-payment-gateway";
import { createMockRefundPaymentService } from "./api/refund/service/mock-refund-payment";
import { EventBus } from "./infrastructure/events/event-bus";
import { EventCancelledBookingHandler } from "./api/booking/controller/event-cancelled.controller";
import { RefundApprovedTicketHandler } from "./api/ticket/controller/refund-approved.controller";
import { success } from "./middlewares/response/response";

import { createEventController } from "./api/event/controller/event.controller";
import { createBookingController } from "./api/booking/controller/booking.controller";
import { createTicketController } from "./api/ticket/controller/ticket.controller";
import { createRefundController } from "./api/refund/controller/refund.controller";
import { createDashboardController } from "./api/dashboard/controller/dashboard.controller";
import { createCustomerController } from "./api/customer/controller/customer.controller";
import { createPromoCodeController } from "./api/promo-code/controller/promo-code.controller";
import { createAuthController } from "./api/auth/controller/auth.controller";

import { createEventRoutes } from "./api/event/routes/event.routes";
import { createBookingRoutes } from "./api/booking/routes/booking.routes";
import { createTicketRoutes } from "./api/ticket/routes/ticket.routes";
import { createRefundRoutes } from "./api/refund/routes/refund.routes";
import { createDashboardRoutes } from "./api/dashboard/routes/dashboard.routes";
import { createCustomerRoutes } from "./api/customer/routes/customer.routes";
import { createPromoCodeRoutes } from "./api/promo-code/routes/promo-code.routes";
import { createAuthRoutes } from "./api/auth/routes/auth.routes";

import { CreateEventHandler } from "./api/event/controller/create-event.controller";
import { UpdateEventHandler } from "./api/event/controller/update-event.controller";
import { DeleteEventHandler } from "./api/event/controller/delete-event.controller";
import { PublishEventHandler } from "./api/event/controller/publish-event.controller";
import { CancelEventHandler } from "./api/event/controller/cancel-event.controller";
import { AddTicketCategoryHandler } from "./api/event/controller/add-ticket-category.controller";
import { UpdateTicketCategoryHandler } from "./api/event/controller/update-ticket-category.controller";
import { DisableTicketCategoryHandler } from "./api/event/controller/disable-ticket-category.controller";
import { GetEventHandler } from "./api/event/controller/get-event.controller";
import { ListEventsHandler } from "./api/event/controller/list-events.controller";
import { GetSalesReportHandler } from "./api/event/controller/get-sales-report.controller";
import { GetParticipantsHandler } from "./api/event/controller/get-participants.controller";
import { GetEventAnalyticsHandler } from "./api/event/controller/get-event-analytics.controller";
import { GetEventRevenueHandler } from "./api/event/controller/get-event-revenue.controller";
import { CreateBookingHandler } from "./api/booking/controller/create-booking.controller";
import { CancelBookingHandler } from "./api/booking/controller/cancel-booking.controller";
import { PayBookingHandler } from "./api/booking/controller/pay-booking.controller";
import { ExpireBookingHandler } from "./api/booking/controller/expire-booking.controller";
import { GetBookingHandler } from "./api/booking/controller/get-booking.controller";
import { ListBookingsHandler } from "./api/booking/controller/list-bookings.controller";
import { GetTicketsByBookingHandler } from "./api/booking/controller/get-tickets.controller";
import { CheckInTicketHandler } from "./api/ticket/controller/check-in-ticket.controller";
import { GetTicketHandler } from "./api/ticket/controller/get-ticket.controller";
import { SearchTicketsHandler } from "./api/ticket/controller/search-tickets.controller";
import { RequestRefundHandler } from "./api/refund/controller/request-refund.controller";
import { ApproveRefundHandler } from "./api/refund/controller/approve-refund.controller";
import { RejectRefundHandler } from "./api/refund/controller/reject-refund.controller";
import { PayoutRefundHandler } from "./api/refund/controller/payout-refund.controller";
import { GetRefundHandler } from "./api/refund/controller/get-refund.controller";
import { ListRefundsHandler } from "./api/refund/controller/list-refunds.controller";
import { GetDashboardStatsHandler } from "./api/dashboard/controller/get-dashboard-stats.controller";
import { GetCustomerBookingsHandler } from "./api/customer/controller/get-customer-bookings.controller";
import { GetCustomerTicketsHandler } from "./api/ticket/controller/get-customer-tickets.controller";
import { GetCustomerRefundsHandler } from "./api/refund/controller/get-customer-refunds.controller";
import { CreatePromoCodeHandler } from "./api/promo-code/controller/create-promo-code.controller";
import { ValidatePromoCodeHandler } from "./api/promo-code/controller/validate-promo-code.controller";
import { DeactivatePromoCodeHandler } from "./api/promo-code/controller/deactivate-promo-code.controller";
import { ListPromoCodesHandler } from "./api/promo-code/controller/list-promo-codes.controller";
import { RegisterUserHandler } from "./api/auth/controller/register-user.controller";
import { LoginUserHandler } from "./api/auth/controller/login-user.controller";

import { onErrorHandler } from "./middlewares/error/error.middleware";
import { loggerMiddleware } from "./middlewares/logger/logger.middleware";
import { securityMiddleware } from "./middlewares/security/security.middleware";
import { requestIdMiddleware } from "./middlewares/request/request-id.middleware";

export async function createApp() {
  const eventRepository = new PostgresEventRepository();
  const bookingRepository = new PostgresBookingRepository();
  const ticketRepository = new PostgresTicketRepository();
  const refundRepository = new PostgresRefundRepository();
  const promoCodeRepository = new PostgresPromoCodeRepository();
  const userRepository = new PostgresUserRepository();

  const jwtSecret =
    process.env.JWT_SECRET || "default-secret-change-in-production";
  const paymentGateway = createMockPaymentGateway();
  const refundPaymentService = createMockRefundPaymentService();

  const eventBus = new EventBus();
  eventBus.register(
    new EventCancelledBookingHandler(bookingRepository, ticketRepository),
  );
  eventBus.register(
    new RefundApprovedTicketHandler(
      refundRepository,
      bookingRepository,
      ticketRepository,
    ),
  );

  const eventHandlers = {
    createEventHandler: new CreateEventHandler(eventRepository),
    updateEventHandler: new UpdateEventHandler(eventRepository),
    deleteEventHandler: new DeleteEventHandler(eventRepository),
    publishEventHandler: new PublishEventHandler(eventRepository),
    cancelEventHandler: new CancelEventHandler(eventRepository, eventBus),
    addTicketCategoryHandler: new AddTicketCategoryHandler(eventRepository),
    updateTicketCategoryHandler: new UpdateTicketCategoryHandler(eventRepository),
    disableTicketCategoryHandler: new DisableTicketCategoryHandler(eventRepository),
    getEventHandler: new GetEventHandler(eventRepository),
    listEventsHandler: new ListEventsHandler(eventRepository),
    getSalesReportHandler: new GetSalesReportHandler(eventRepository, bookingRepository),
    getParticipantsHandler: new GetParticipantsHandler(eventRepository, bookingRepository, ticketRepository),
    getEventAnalyticsHandler: new GetEventAnalyticsHandler(eventRepository, bookingRepository, ticketRepository),
    getEventRevenueHandler: new GetEventRevenueHandler(eventRepository, bookingRepository),
  };

  const bookingHandlers = {
    createBookingHandler: new CreateBookingHandler(eventRepository, bookingRepository),
    cancelBookingHandler: new CancelBookingHandler(bookingRepository, eventRepository),
    payBookingHandler: new PayBookingHandler(bookingRepository, ticketRepository, paymentGateway),
    expireBookingHandler: new ExpireBookingHandler(bookingRepository, eventRepository),
    getBookingHandler: new GetBookingHandler(bookingRepository, eventRepository),
    listBookingsHandler: new ListBookingsHandler(bookingRepository, eventRepository),
    getTicketsHandler: new GetTicketsByBookingHandler(bookingRepository, ticketRepository, eventRepository),
  };

  const ticketHandlers = {
    checkInHandler: new CheckInTicketHandler(ticketRepository, eventRepository),
    getTicketHandler: new GetTicketHandler(ticketRepository, eventRepository),
    searchTicketsHandler: new SearchTicketsHandler(ticketRepository, eventRepository),
  };

  const refundHandlers = {
    requestRefundHandler: new RequestRefundHandler(bookingRepository, ticketRepository, refundRepository),
    approveRefundHandler: new ApproveRefundHandler(refundRepository, eventBus),
    rejectRefundHandler: new RejectRefundHandler(refundRepository),
    payoutRefundHandler: new PayoutRefundHandler(refundRepository, refundPaymentService),
    getRefundHandler: new GetRefundHandler(refundRepository),
    listRefundsHandler: new ListRefundsHandler(refundRepository),
  };

  const dashboardHandlers = {
    getDashboardStatsHandler: new GetDashboardStatsHandler(eventRepository, bookingRepository, ticketRepository, refundRepository),
  };

  const customerHandlers = {
    getCustomerBookingsHandler: new GetCustomerBookingsHandler(bookingRepository, eventRepository),
    getCustomerTicketsHandler: new GetCustomerTicketsHandler(ticketRepository, eventRepository, bookingRepository),
    getCustomerRefundsHandler: new GetCustomerRefundsHandler(refundRepository, bookingRepository),
  };

  const promoCodeHandlers = {
    createPromoCodeHandler: new CreatePromoCodeHandler(promoCodeRepository, eventRepository),
    validatePromoCodeHandler: new ValidatePromoCodeHandler(promoCodeRepository),
    deactivatePromoCodeHandler: new DeactivatePromoCodeHandler(promoCodeRepository),
    listPromoCodesHandler: new ListPromoCodesHandler(promoCodeRepository),
  };

  const authHandlers = {
    registerHandler: new RegisterUserHandler(userRepository),
    loginHandler: new LoginUserHandler(userRepository),
  };

  const eventController = createEventController(eventHandlers);
  const bookingController = createBookingController(bookingHandlers);
  const ticketController = createTicketController(ticketHandlers);
  const refundController = createRefundController(refundHandlers);
  const dashboardController = createDashboardController(dashboardHandlers);
  const customerController = createCustomerController(customerHandlers);
  const promoCodeController = createPromoCodeController(promoCodeHandlers);
  const authController = createAuthController(authHandlers, {
    userRepository,
    jwtSecret,
  });

  const app = new Elysia()
    .use(loggerMiddleware)
    .use(securityMiddleware)
    .use(requestIdMiddleware)
    .onError(onErrorHandler)
    .use(
      swagger({
        documentation: {
          info: {
            title: "Event Ticketing & Booking API",
            version: "1.0.0",
            description: "Clean Architecture implementation with DDD patterns",
          },
          tags: [
            { name: "Authentication", description: "User authentication and authorization" },
            { name: "Events", description: "Event management and ticket categories" },
            { name: "Bookings", description: "Ticket booking and payment" },
            { name: "Tickets", description: "Ticket check-in and validation" },
            { name: "Refunds", description: "Refund request and approval" },
            { name: "Dashboard", description: "Dashboard statistics and analytics" },
            { name: "Customers", description: "Customer portal endpoints" },
            { name: "Promo Codes", description: "Promo code management and validation" },
          ],
        },
      }),
    )
    .get("/", () => ({
      name: "Event Ticketing & Booking API",
      version: "1.0.0",
      description: "Clean Architecture + Domain-Driven Design",
      techStack: ["Bun", "ElysiaJS", "TypeScript", "Drizzle ORM", "Supabase"],
      baseUrl: "/api/v1",
      documentation: { swagger: "/swagger", health: "/health" },
      endpoints: {
        auth: [
          { method: "POST", path: "/api/v1/auth/register", description: "Register new user" },
          { method: "POST", path: "/api/v1/auth/login", description: "Login user" },
          { method: "GET", path: "/api/v1/auth/me", description: "Get current user" },
        ],
        events: [
          { method: "GET", path: "/api/v1/events", description: "List all published events" },
          { method: "GET", path: "/api/v1/events/:id", description: "Get event details" },
          { method: "POST", path: "/api/v1/events", description: "Create new event" },
          { method: "PUT", path: "/api/v1/events/:id", description: "Update draft event" },
          { method: "DELETE", path: "/api/v1/events/:id", description: "Delete draft event" },
          { method: "POST", path: "/api/v1/events/:id/publish", description: "Publish event" },
          { method: "POST", path: "/api/v1/events/:id/cancel", description: "Cancel event" },
          { method: "POST", path: "/api/v1/events/:id/ticket-categories", description: "Add ticket category" },
          { method: "PUT", path: "/api/v1/events/:id/ticket-categories/:categoryId", description: "Update ticket category" },
          { method: "POST", path: "/api/v1/events/:id/ticket-categories/:categoryId/disable", description: "Disable ticket category" },
          { method: "GET", path: "/api/v1/events/:id/sales-report", description: "Get sales report" },
          { method: "GET", path: "/api/v1/events/:id/participants", description: "Get participants list" },
          { method: "GET", path: "/api/v1/events/:id/analytics", description: "Get event analytics" },
          { method: "GET", path: "/api/v1/events/:id/revenue", description: "Get event revenue breakdown" },
        ],
        bookings: [
          { method: "GET", path: "/api/v1/bookings", description: "List all bookings (admin)" },
          { method: "POST", path: "/api/v1/bookings", description: "Create new booking" },
          { method: "GET", path: "/api/v1/bookings/:id", description: "Get booking details" },
          { method: "DELETE", path: "/api/v1/bookings/:id", description: "Cancel pending booking" },
          { method: "POST", path: "/api/v1/bookings/:id/pay", description: "Pay for booking" },
          { method: "POST", path: "/api/v1/bookings/:id/expire", description: "Expire booking (admin)" },
          { method: "GET", path: "/api/v1/bookings/:id/tickets", description: "Get booking tickets" },
        ],
        tickets: [
          { method: "GET", path: "/api/v1/tickets", description: "Search tickets" },
          { method: "GET", path: "/api/v1/tickets/:id", description: "Get ticket details" },
          { method: "POST", path: "/api/v1/tickets/check-in", description: "Check in ticket" },
        ],
        refunds: [
          { method: "GET", path: "/api/v1/refunds", description: "List all refunds (admin)" },
          { method: "POST", path: "/api/v1/refunds", description: "Request refund" },
          { method: "GET", path: "/api/v1/refunds/:id", description: "Get refund details" },
          { method: "POST", path: "/api/v1/refunds/:id/approve", description: "Approve refund" },
          { method: "POST", path: "/api/v1/refunds/:id/reject", description: "Reject refund" },
          { method: "POST", path: "/api/v1/refunds/:id/payout", description: "Payout refund" },
        ],
        dashboard: [
          { method: "GET", path: "/api/v1/dashboard/stats", description: "Get dashboard statistics (admin)" },
        ],
        customers: [
          { method: "GET", path: "/api/v1/customers/me/bookings?email={email}", description: "Get customer bookings" },
          { method: "GET", path: "/api/v1/customers/me/tickets?email={email}", description: "Get customer tickets" },
          { method: "GET", path: "/api/v1/customers/me/refunds?email={email}", description: "Get customer refunds" },
        ],
        promoCodes: [
          { method: "POST", path: "/api/v1/events/:eventId/promo-codes", description: "Create promo code" },
          { method: "GET", path: "/api/v1/events/:eventId/promo-codes", description: "List promo codes" },
          { method: "POST", path: "/api/v1/promo-codes/validate", description: "Validate promo code" },
          { method: "POST", path: "/api/v1/promo-codes/:id/deactivate", description: "Deactivate promo code" },
        ],
      },
    }))
    .get("/health", () =>
      success(
        { status: "ok", service: "event-ticketing-booking-api", timestamp: new Date().toISOString() },
        "Service is healthy",
      ),
    )
    .use(createAuthRoutes(authController))
    .use(createEventRoutes(eventController))
    .use(createBookingRoutes(bookingController))
    .use(createTicketRoutes(ticketController))
    .use(createRefundRoutes(refundController))
    .use(createDashboardRoutes(dashboardController))
    .use(createCustomerRoutes(customerController))
    .use(createPromoCodeRoutes(promoCodeController));

  return app;
}

export type App = Awaited<ReturnType<typeof createApp>>;

