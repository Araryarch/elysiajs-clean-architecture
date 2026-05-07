import { Elysia } from "elysia";
import { DomainError } from "@/app/main/shared/errors/domain-error";
import { error } from "@/app/main/shared/utils/response/response";
import { appConfig } from "@/app/main/config/app.config";

/**
 * Global error handling middleware.
 * Maps domain errors and Elysia lifecycle errors to consistent API responses.
 */
export const errorMiddleware = new Elysia({ name: "error-middleware" }).onError(
  ({ code, error: err, set }) => {
    // Domain errors — known business rule violations
    if (err instanceof DomainError) {
      set.status = err.statusCode;
      return error(err.message, err.code ?? "DOMAIN_ERROR", undefined, {
        name: err.name,
      });
    }

    // Elysia validation errors (TypeBox schema mismatch)
    if (code === "VALIDATION") {
      set.status = 422;
      return error("Validation failed", "VALIDATION_ERROR", undefined, {
        details: err.message,
      });
    }

    // Route not found
    if (code === "NOT_FOUND") {
      set.status = 404;
      return error("Resource not found", "NOT_FOUND");
    }

    // Malformed request body
    if (code === "PARSE") {
      set.status = 400;
      return error("Invalid request body", "PARSE_ERROR");
    }

    // Unexpected errors
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
