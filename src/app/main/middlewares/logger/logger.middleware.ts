import { Elysia } from "elysia";

/**
 * Request/response logger middleware.
 * Logs method, path, status code, and duration for every request.
 */
export const loggerMiddleware = new Elysia({ name: "logger-middleware" })
  .onRequest(({ request, store }) => {
    (store as Record<string, unknown>)["requestStart"] = Date.now();
    console.log(`→ ${request.method} ${new URL(request.url).pathname}`);
  })
  .onAfterHandle(({ request, set, store }) => {
    const start = (store as Record<string, unknown>)["requestStart"] as number | undefined;
    const duration = start ? `${Date.now() - start}ms` : "-";
    const status = set.status ?? 200;
    console.log(
      `← ${request.method} ${new URL(request.url).pathname} ${status} (${duration})`,
    );
  });
