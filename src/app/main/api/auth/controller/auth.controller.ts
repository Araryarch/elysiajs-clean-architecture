import { RegisterUserCommand } from "./register-user.controller";
import { LoginUserCommand } from "./login-user.controller";
import type { RegisterUserHandler } from "./register-user.controller";
import type { LoginUserHandler } from "./login-user.controller";
import type { IUserRepository } from "../repository/user-repository";
import { success } from "../../../shared/utils/response/response";

export type AuthControllerHandlers = {
  registerHandler: RegisterUserHandler;
  loginHandler: LoginUserHandler;
};

export const createAuthController = (handlers: AuthControllerHandlers, deps: { userRepository: IUserRepository; jwtSecret: string }) => ({
  jwtSecret: deps.jwtSecret,
  userRepository: deps.userRepository as any,

  register(body: { email: string; password: string; name: string; role?: string }) {
    const command = new RegisterUserCommand(body.email, body.password, body.name, body.role);
    return handlers.registerHandler.execute(command)
      .then((userId) => success({ id: userId }, "User registered successfully"));
  },

  async login(body: { email: string; password: string }, jwt: any) {
    const command = new LoginUserCommand(body.email, body.password);
    const result = await handlers.loginHandler.execute(command);

    const accessToken = await jwt.sign({
      userId: result.userId,
      email: result.email,
      role: result.role,
    });

    return success(
      { accessToken, user: { id: result.userId, email: result.email, name: result.name, role: result.role } },
      "Login successful",
    );
  },

  async me(headers: Record<string, string | undefined>, jwt: any) {
    const authorization = headers.authorization;
    if (!authorization || !authorization.startsWith("Bearer ")) {
      throw new Error("Unauthorized");
    }

    const token = authorization.substring(7);
    const payload = await jwt.verify(token);
    if (!payload) {
      throw new Error("Invalid token");
    }

    const user = await deps.userRepository.findById(payload.userId as string);
    if (!user) {
      throw new Error("User not found");
    }

    return success(user.toPublicJSON(), "User retrieved successfully");
  },
});

export type AuthController = ReturnType<typeof createAuthController>;
