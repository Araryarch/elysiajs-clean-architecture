import type { ElysiaSwaggerConfig } from "@elysiajs/swagger";

/**
 * Swagger/OpenAPI documentation configuration.
 * Imported by create-app.ts.
 */
export const swaggerConfig: ElysiaSwaggerConfig = {
  documentation: {
    info: {
      title: "Event Ticketing & Booking API",
      version: "1.0.0",
      description:
        "RESTful API for event management, ticket booking, and refund processing. " +
        "Built with Bun, ElysiaJS, Drizzle ORM, and PostgreSQL following DDD principles.",
      contact: {
        name: "API Support",
        email: "support@eventapp.id",
      },
    },
    tags: [
      { name: "Authentication", description: "User registration, login, and profile" },
      { name: "Events", description: "Event lifecycle and ticket category management" },
      { name: "Bookings", description: "Ticket booking and payment processing" },
      { name: "Tickets", description: "Ticket check-in and validation" },
      { name: "Refunds", description: "Refund request, approval, and payout" },
      { name: "Dashboard", description: "Admin statistics and analytics" },
      { name: "Customers", description: "Customer self-service portal" },
      { name: "Promo Codes", description: "Promo code creation and validation" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
};
