import { Elysia } from "elysia";

/**
 * Request ID middleware.
 * Attaches a unique X-Request-ID header to every request/response
 * for distributed tracing and log correlation.
 */
export const requestIdMiddleware = new Elysia({ name: "request-id-middleware" })
  .onRequest(({ request, set }) => {
    const existing = request.headers.get("x-request-id");
    const requestId = existing ?? crypto.randomUUID();
    (set.headers as Record<string, string>)["X-Request-ID"] = requestId;
  });
