import { Elysia } from "elysia";
import swagger from "@elysiajs/swagger";
import { DomainError } from "./src/domain/errors/domain-error.js";
import { PostgresEventRepository } from "./src/infrastructure/repositories/postgres-event.repository.js";
import { PostgresBookingRepository } from "./src/infrastructure/repositories/postgres-booking.repository.js";
import { PostgresTicketRepository } from "./src/infrastructure/repositories/postgres-ticket.repository.js";
import { PostgresRefundRepository } from "./src/infrastructure/repositories/postgres-refund.repository.js";
import { createMockPaymentGateway } from "./src/infrastructure/services/mock-payment-gateway.js";
import { createMockRefundPaymentService } from "./src/infrastructure/services/mock-refund-payment.js";
import { createMockNotificationService } from "./src/infrastructure/services/mock-notification.js";
import { createEventController } from "./src/presentation/http/controllers/event.controller.js";
import { createBookingController } from "./src/presentation/http/controllers/booking.controller.js";
import { createTicketController } from "./src/presentation/http/controllers/ticket.controller.js";
import { createRefundController } from "./src/presentation/http/controllers/refund.controller.js";
import { error, success } from "./src/presentation/http/response.js";

async function createApp() {
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
    );

  return app;
}

export default await createApp();
