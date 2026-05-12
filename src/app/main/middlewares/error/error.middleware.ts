import { Elysia } from "elysia";
import { DomainError } from "../../shared/errors/domain-error";
import { error } from "../../shared/utils/response/response";
import { appConfig } from "../../config/app.config";

export const errorMiddleware = new Elysia({ name: "error-middleware" }).onError(
  ({ code, error: err, set }) => {

    if (err instanceof DomainError) {
      const domainErr = err as DomainError;
      set.status = domainErr.statusCode;
      return error(domainErr.message, domainErr.code ?? "DOMAIN_ERROR", undefined, {
        name: domainErr.name,
      });
    }

    if (code === "VALIDATION") {
      set.status = 422;
      return error("Validation failed", "VALIDATION_ERROR", undefined, {
        details: err.message,
      });
    }

    if (code === "NOT_FOUND") {
      set.status = 404;
      return error("Resource not found", "NOT_FOUND");
    }

    if (code === "PARSE") {
      set.status = 400;
      return error("Invalid request body", "PARSE_ERROR");
    }

    console.error("[error-middleware] Unexpected error:", err);
    set.status = 500;
    return error("Internal server error", "INTERNAL_ERROR", undefined, {
      message:
        appConfig.env === "development" && err instanceof Error
          ? err.message
          : undefined,
    });
  },
);

