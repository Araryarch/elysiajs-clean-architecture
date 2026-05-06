import { Elysia } from "elysia";

// Minimal app untuk testing
const app = new Elysia()
  .get("/", () => ({
    message: "Hello from Vercel!",
    timestamp: new Date().toISOString(),
  }))
  .get("/health", () => ({
    status: "ok",
    service: "event-ticketing-booking-api",
  }));

export default app;
