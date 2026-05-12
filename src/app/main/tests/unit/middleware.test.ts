import { describe, expect, it } from "bun:test";
import {
  DomainError, NotFoundError, ValidationError,
  ConflictError, UnauthorizedError, ForbiddenError,
} from "../../shared/errors/domain-error";
import { success, error } from "../../shared/utils/response/response";

describe("DomainError classes", () => {
  it("creates base DomainError with correct properties", () => {
    const err = new DomainError("Domain violation", 400, "DOMAIN_ERROR");
    expect(err.message).toBe("Domain violation");
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("DOMAIN_ERROR");
    expect(err.name).toBe("DomainError");
  });

  it("creates NotFoundError with correct properties", () => {
    const err = new NotFoundError("Event", "evt-1");
    expect(err.message).toBe("Event with id 'evt-1' not found");
    expect(err.statusCode).toBe(404);
    expect(err.name).toBe("NotFoundError");
  });

  it("creates NotFoundError without id", () => {
    const err = new NotFoundError("Event");
    expect(err.message).toBe("Event not found");
  });

  it("creates ValidationError", () => {
    const err = new ValidationError("Invalid input", "name");
    expect(err.statusCode).toBe(400);
    expect(err.name).toBe("ValidationError");
  });

  it("creates ConflictError with 409", () => {
    const err = new ConflictError("Duplicate entry");
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe("CONFLICT");
  });

  it("creates UnauthorizedError with 401", () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
    expect(err.message).toBe("Unauthorized");
  });

  it("creates ForbiddenError with 403", () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
  });
});

describe("Response helpers", () => {
  it("creates success response correctly", () => {
    const res = success({ id: "1" }, "Created");
    expect(res.success).toBe(true);
    expect(res.message).toBe("Created");
    expect(res.data).toEqual({ id: "1" });
  });

  it("creates error response correctly", () => {
    const res = error("Not found", "NOT_FOUND");
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("NOT_FOUND");
  });

  it("creates error with details", () => {
    const res = error("Invalid", "VALIDATION_ERROR", "email", { format: "email" });
    expect(res.error?.field).toBe("email");
    expect(res.error?.details).toEqual({ format: "email" });
  });
});

describe("Express-style error handling logic", () => {
  function handleError(err: unknown) {
    if (err instanceof DomainError) {
      const de = err as DomainError;
      return { status: de.statusCode, body: error(de.message, de.code || "DOMAIN_ERROR") };
    }
    return { status: 500, body: error("Internal error", "INTERNAL_ERROR") };
  }

  it("maps DomainError to 400", () => {
    const result = handleError(new DomainError("Bad request", 400));
    expect(result.status).toBe(400);
  });

  it("maps NotFoundError to 404", () => {
    const result = handleError(new NotFoundError("Resource"));
    expect(result.status).toBe(404);
  });

  it("maps ConflictError to 409", () => {
    const result = handleError(new ConflictError("Conflict"));
    expect(result.status).toBe(409);
  });

  it("maps UnauthorizedError to 401", () => {
    const result = handleError(new UnauthorizedError());
    expect(result.status).toBe(401);
  });

  it("maps ForbiddenError to 403", () => {
    const result = handleError(new ForbiddenError());
    expect(result.status).toBe(403);
  });

  it("maps unknown errors to 500", () => {
    const result = handleError(new Error("Unexpected"));
    expect(result.status).toBe(500);
  });
});
