import { Elysia } from "elysia";

export const securityMiddleware = new Elysia({ name: "security-middleware" }).onAfterHandle(
  ({ set }) => {
    const headers = set.headers as Record<string, string>;
    headers["X-Content-Type-Options"] = "nosniff";
    headers["X-Frame-Options"] = "DENY";
    headers["X-XSS-Protection"] = "1; mode=block";
    headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
  },
);

