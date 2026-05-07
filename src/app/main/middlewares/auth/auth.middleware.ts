import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { IUserRepository } from "@/app/main/repositories/auth/user-repository";
import { UserRole } from "@/app/main/entities/auth/user";

export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
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
        throw new Error("Unauthorized - No token provided");
      }

      const token = authorization.substring(7);
      const payload = await jwt.verify(token);

      if (!payload) {
        set.status = 401;
        throw new Error("Unauthorized - Invalid token");
      }

      // Verify user still exists and is active
      const user = await userRepository.findById(payload.userId as string);
      if (!user || !user.isActive()) {
        set.status = 401;
        throw new Error("Unauthorized - User not found or inactive");
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
  return (context: { user?: AuthUser; set: any }) => {
    if (!context.user) {
      context.set.status = 401;
      throw new Error("Unauthorized");
    }

    if (!allowedRoles.includes(context.user.role)) {
      context.set.status = 403;
      throw new Error("Forbidden - Insufficient permissions");
    }

    return context;
  };
};

// Helper untuk check specific roles
export const requireAdmin = () => requireRole([UserRole.ADMIN]);
export const requireOrganizer = () => requireRole([UserRole.ORGANIZER, UserRole.ADMIN]);
export const requireCustomer = () => requireRole([UserRole.CUSTOMER, UserRole.ORGANIZER, UserRole.ADMIN]);
