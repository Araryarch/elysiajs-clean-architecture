import { Elysia, t, type TSchema } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { RegisterUserCommand, RegisterUserHandler } from "@/application/commands/register-user.command";
import { LoginUserCommand, LoginUserHandler } from "@/application/commands/login-user.command";
import { IUserRepository } from "@/domain/repositories/user-repository";
import { success } from "@/presentation/http/response";

const SuccessResponse = <T extends TSchema>(data: T) =>
  t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: data,
  });

const IdResponse = t.Object({ id: t.String() });

const LoginResponse = t.Object({
  accessToken: t.String(),
  user: t.Object({
    id: t.String(),
    email: t.String(),
    name: t.String(),
    role: t.String(),
  }),
});

export const createAuthController = (deps: {
  userRepository: IUserRepository;
  jwtSecret: string;
}) => {
  const registerHandler = new RegisterUserHandler(deps.userRepository);
  const loginHandler = new LoginUserHandler(deps.userRepository);

  return new Elysia({ prefix: "/api/v1/auth" })
    .use(
      jwt({
        name: "jwt",
        secret: deps.jwtSecret,
        exp: "7d", // Token expires in 7 days
      })
    )
    .post(
      "/register",
      async ({ body }) => {
        const command = new RegisterUserCommand(
          body.email,
          body.password,
          body.name,
          body.role,
        );
        const userId = await registerHandler.execute(command);
        return success({ id: userId }, "User registered successfully");
      },
      {
        body: t.Object({
          email: t.String({ format: "email" }),
          password: t.String({ minLength: 8 }),
          name: t.String({ minLength: 1 }),
          role: t.Optional(t.Union([t.Literal("Customer"), t.Literal("Organizer")])),
        }),
        response: {
          201: SuccessResponse(IdResponse),
        },
        detail: {
          summary: "Register User",
          description: "Register a new user account",
          tags: ["Authentication"],
        },
      },
    )
    .post(
      "/login",
      async ({ body, jwt }) => {
        const command = new LoginUserCommand(body.email, body.password);
        const result = await loginHandler.execute(command);

        // Generate JWT token
        const accessToken = await jwt.sign({
          userId: result.userId,
          email: result.email,
          role: result.role,
        });

        return success(
          {
            accessToken,
            user: {
              id: result.userId,
              email: result.email,
              name: result.name,
              role: result.role,
            },
          },
          "Login successful"
        );
      },
      {
        body: t.Object({
          email: t.String({ format: "email" }),
          password: t.String({ minLength: 1 }),
        }),
        response: {
          200: SuccessResponse(LoginResponse),
        },
        detail: {
          summary: "Login",
          description: "Login with email and password",
          tags: ["Authentication"],
        },
      },
    )
    .get(
      "/me",
      async ({ headers, jwt, set }) => {
        const authorization = headers.authorization;
        if (!authorization || !authorization.startsWith("Bearer ")) {
          set.status = 401;
          throw new Error("Unauthorized");
        }

        const token = authorization.substring(7);
        const payload = await jwt.verify(token);

        if (!payload) {
          set.status = 401;
          throw new Error("Invalid token");
        }

        const user = await deps.userRepository.findById(payload.userId as string);
        if (!user) {
          set.status = 404;
          throw new Error("User not found");
        }

        return success(user.toPublicJSON(), "User retrieved successfully");
      },
      {
        headers: t.Object({
          authorization: t.String(),
        }),
        response: {
          200: SuccessResponse(
            t.Object({
              id: t.String(),
              email: t.String(),
              name: t.String(),
              role: t.String(),
            })
          ),
        },
        detail: {
          summary: "Get Current User",
          description: "Get currently authenticated user information",
          tags: ["Authentication"],
        },
      },
    );
};
