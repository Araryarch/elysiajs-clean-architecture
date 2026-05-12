import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import type { AuthController } from "../controller/auth.controller";

export const createAuthRoutes = (controller: AuthController) =>
  new Elysia({ prefix: "/api/v1/auth" })
    .use(jwt({ name: "jwt", secret: controller.jwtSecret }))
    .post("/register", ({ body }) => controller.register(body), {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 6 }),
        name: t.String({ minLength: 1 }),
        role: t.Optional(t.String()),
      }),
    })
    .post("/login", ({ body, jwt }) => controller.login(body, jwt), {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 1 }),
      }),
    })
    .get("/me", ({ headers, jwt }) => controller.me(headers, jwt));
