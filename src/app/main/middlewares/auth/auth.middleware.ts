import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { IUserRepository } from "../../api/auth/repository/user-repository";
import { UserRole } from "../../entities/auth/user";
import { UnauthorizedError, ForbiddenError } from "../../shared/errors/domain-error";

export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
}

export type JWTPayload = {
  userId: string;
  email: string;
  role: UserRole;
};

// Elysia JWT plugin interface
export interface ElysiaJWT {
  sign(payload: Record<string, unknown>): Promise<string>;
  verify(token?: string): Promise<false | Record<string, unknown>>;
}

export const createAuthMiddleware = (jwtSecret: string, userRepository: IUserRepository) => {
  return new Elysia({ name: "auth" })
    .use(
      jwt({
        name: "jwt",
        secret: jwtSecret,
        exp: "7d",
      })
    )
    .derive(async ({ headers, jwt, set }) => {
      const authorization = headers.authorization;
      
      if (!authorization || !authorization.startsWith("Bearer ")) {
        set.status = 401;
        throw new UnauthorizedError("No token provided");
      }

      const token = authorization.substring(7);
      const payload = await (jwt as ElysiaJWT).verify(token);

      if (!payload) {
        set.status = 401;
        throw new UnauthorizedError("Invalid token");
      }

      const user = await userRepository.findById(payload.userId as string);
      if (!user || !user.isActive()) {
        set.status = 401;
        throw new UnauthorizedError("User not found or inactive");
      }

      return {
        user: {
          userId: user.id,
          email: user.email.value,
          role: user.role,
        } as AuthUser,
      };
    });
};

export const requireRole = (allowedRoles: UserRole[]) => {
  return (context: { user?: AuthUser; set: { status: number } }) => {
    if (!context.user) {
      context.set.status = 401;
      throw new UnauthorizedError();
    }

    if (!allowedRoles.includes(context.user.role)) {
      context.set.status = 403;
      throw new ForbiddenError("Insufficient permissions");
    }

    return context;
  };
};

export const requireAdmin = () => requireRole([UserRole.ADMIN]);
export const requireOrganizer = () => requireRole([UserRole.ORGANIZER, UserRole.ADMIN]);
export const requireCustomer = () => requireRole([UserRole.CUSTOMER, UserRole.ORGANIZER, UserRole.ADMIN]);

