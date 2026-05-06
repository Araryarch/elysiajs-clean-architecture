import swagger from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { DomainError } from "@/domain/errors/domain-error";
import { PostgresEventRepository } from "@/infrastructure/repositories/postgres-event.repository";
import { PostgresBookingRepository } from "@/infrastructure/repositories/postgres-booking.repository";
import { PostgresTicketRepository } from "@/infrastructure/repositories/postgres-ticket.repository";
import { PostgresRefundRepository } from "@/infrastructure/repositories/postgres-refund.repository";
import { createMockPaymentGateway } from "@/infrastructure/services/mock-payment-gateway";
import { createMockRefundPaymentService } from "@/infrastructure/services/mock-refund-payment";
import { createMockNotificationService } from "@/infrastructure/services/mock-notification";
import { createEventController } from "./controllers/event.controller";
import { createBookingController } from "./controllers/booking.controller";
import { createTicketController } from "./controllers/ticket.controller";
import { createRefundController } from "./controllers/refund.controller";
import { createDashboardController } from "./controllers/dashboard.controller";
import { createCustomerController } from "./controllers/customer.controller";
import { error, success } from "./response";

export async function createApp() {
  // Initialize repositories
  const eventRepository = new PostgresEventRepository();
  const bookingRepository = new PostgresBookingRepository();
  const ticketRepository = new PostgresTicketRepository();
  const refundRepository = new PostgresRefundRepository();

  // Initialize services
  const paymentGateway = createMockPaymentGateway();
  const refundPaymentService = createMockRefundPaymentService();
  const notificationService = createMockNotificationService();

  const app = new Elysia()
    .use(
      swagger({
        documentation: {
          info: {
            title: "Event Ticketing & Booking API",
            version: "1.0.0",
            description: "Clean Architecture implementation with DDD patterns",
          },
          tags: [
            { name: "Events", description: "Event management and ticket categories" },
            { name: "Bookings", description: "Ticket booking and payment" },
            { name: "Tickets", description: "Ticket check-in and validation" },
            { name: "Refunds", description: "Refund request and approval" },
            { name: "Dashboard", description: "Dashboard statistics and analytics" },
            { name: "Customers", description: "Customer portal endpoints" },
          ],
        },
      })
    )
    .onError(({ code, error: err, set }) => {
      // Handle domain errors
      if (err instanceof DomainError) {
        set.status = err.statusCode;
        return error(err.message, err.code || "DOMAIN_ERROR", undefined, {
          name: err.name,
        });
      }

      // Handle validation errors from Elysia
      if (code === "VALIDATION") {
        set.status = 422;
        return error("Validation failed", "VALIDATION_ERROR", undefined, {
          details: err.message,
        });
      }

      // Handle not found
      if (code === "NOT_FOUND") {
        set.status = 404;
        return error("Resource not found", "NOT_FOUND");
      }

      // Handle parse errors
      if (code === "PARSE") {
        set.status = 400;
        return error("Invalid request body", "PARSE_ERROR");
      }

      // Handle internal server errors
      console.error("Unexpected error:", err);
      set.status = 500;
      return error("Internal server error", "INTERNAL_ERROR", undefined, {
        message:
          process.env.NODE_ENV === "development" && err instanceof Error
            ? err.message
            : undefined,
      });
    })
    .get("/", () => {
      return {
        name: "Event Ticketing & Booking API",
        version: "1.0.0",
        description: "Clean Architecture + Domain-Driven Design",
        techStack: ["Bun", "ElysiaJS", "TypeScript", "Drizzle ORM", "Supabase"],
        baseUrl: "/api/v1",
        documentation: {
          swagger: "/swagger",
          health: "/health"
        },
        endpoints: {
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
            { method: "GET", path: "/api/v1/events/:id/revenue", description: "Get event revenue breakdown" }
          ],
          bookings: [
            { method: "GET", path: "/api/v1/bookings", description: "List all bookings (admin)" },
            { method: "POST", path: "/api/v1/bookings", description: "Create new booking" },
            { method: "GET", path: "/api/v1/bookings/:id", description: "Get booking details" },
            { method: "DELETE", path: "/api/v1/bookings/:id", description: "Cancel pending booking" },
            { method: "POST", path: "/api/v1/bookings/:id/pay", description: "Pay for booking" },
            { method: "POST", path: "/api/v1/bookings/:id/expire", description: "Expire booking (admin)" },
            { method: "GET", path: "/api/v1/bookings/:id/tickets", description: "Get booking tickets" }
          ],
          tickets: [
            { method: "GET", path: "/api/v1/tickets", description: "Search tickets" },
            { method: "GET", path: "/api/v1/tickets/:id", description: "Get ticket details" },
            { method: "POST", path: "/api/v1/tickets/check-in", description: "Check in ticket" }
          ],
          refunds: [
            { method: "GET", path: "/api/v1/refunds", description: "List all refunds (admin)" },
            { method: "POST", path: "/api/v1/refunds", description: "Request refund" },
            { method: "GET", path: "/api/v1/refunds/:id", description: "Get refund details" },
            { method: "POST", path: "/api/v1/refunds/:id/approve", description: "Approve refund" },
            { method: "POST", path: "/api/v1/refunds/:id/reject", description: "Reject refund" },
            { method: "POST", path: "/api/v1/refunds/:id/payout", description: "Payout refund" }
          ],
          dashboard: [
            { method: "GET", path: "/api/v1/dashboard/stats", description: "Get dashboard statistics (admin)" }
          ],
          customers: [
            { method: "GET", path: "/api/v1/customers/me/bookings?email={email}", description: "Get customer bookings" },
            { method: "GET", path: "/api/v1/customers/me/tickets?email={email}", description: "Get customer tickets" },
            { method: "GET", path: "/api/v1/customers/me/refunds?email={email}", description: "Get customer refunds" }
          ]
        },
      };
    })
    .get("/health", () =>
      success(
        {
          status: "ok",
          service: "event-ticketing-booking-api",
          timestamp: new Date().toISOString(),
        },
        "Service is healthy"
      )
    )
    .use(
      createEventController({
        eventRepository,
        bookingRepository,
        ticketRepository,
      })
    )
    .use(
      createBookingController({
        eventRepository,
        bookingRepository,
        ticketRepository,
        paymentGateway,
      })
    )
    .use(
      createTicketController({
        ticketRepository,
        eventRepository,
      })
    )
    .use(
      createRefundController({
        bookingRepository,
        ticketRepository,
        refundRepository,
        refundPaymentService,
      })
    )
    .use(
      createDashboardController({
        eventRepository,
        bookingRepository,
        ticketRepository,
        refundRepository,
      })
    )
    .use(
      createCustomerController({
        eventRepository,
        bookingRepository,
        ticketRepository,
        refundRepository,
      })
    );

  return app;
}

export type App = Awaited<ReturnType<typeof createApp>>;
