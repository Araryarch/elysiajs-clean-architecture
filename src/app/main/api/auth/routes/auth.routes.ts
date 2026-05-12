import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import type { AuthController } from "../controller/auth.controller";

export const createAuthRoutes = (controller: AuthController) =>
  new Elysia({ prefix: "/api/v1/auth" })
    .use(jwt({ name: "jwt", secret: controller.jwtSecret }))
    .post("/register", ({ body }) => controller.register(body))
    .post("/login", ({ body, jwt }) => controller.login(body, jwt))
    .get("/me", ({ headers, jwt }) => controller.me(headers, jwt));
