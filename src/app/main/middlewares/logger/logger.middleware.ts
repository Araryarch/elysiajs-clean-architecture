import { Elysia } from "elysia";

export const loggerMiddleware = new Elysia({ name: "logger-middleware" })
  .onRequest(({ request, store }) => {
    (store as Record<string, unknown>)["requestStart"] = Date.now();
    console.log(`â†’ ${request.method} ${new URL(request.url).pathname}`);
  })
  .onAfterHandle(({ request, set, store }) => {
    const start = (store as Record<string, unknown>)["requestStart"] as number | undefined;
    const duration = start ? `${Date.now() - start}ms` : "-";
    const status = set.status ?? 200;
    console.log(
      `â† ${request.method} ${new URL(request.url).pathname} ${status} (${duration})`,
    );
  });

