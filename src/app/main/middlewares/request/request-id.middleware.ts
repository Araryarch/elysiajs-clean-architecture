import { Elysia } from "elysia";

export const requestIdMiddleware = new Elysia({ name: "request-id-middleware" })
  .onRequest(({ request, set }) => {
    const existing = request.headers.get("x-request-id");
    const requestId = existing ?? crypto.randomUUID();
    (set.headers as Record<string, string>)["X-Request-ID"] = requestId;
  });

