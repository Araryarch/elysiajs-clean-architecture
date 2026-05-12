import { eq } from "drizzle-orm";
import { db } from "../../../database/drizzle/index/connection";
import { users } from "../../../database/drizzle/schema/schema";
import { User } from "../../../entities/auth/user";
import { IUserRepository } from "./user-repository";

export class PostgresUserRepository implements IUserRepository {
  async save(user: User): Promise<void> {
    const json = user.toJSON();

    await db
      .insert(users)
      .values({
        id: json.id,
        email: json.email,
        passwordHash: user.passwordHash,
        name: json.name,
        role: json.role,
        status: json.status,
        createdAt: json.createdAt,
        lastLoginAt: json.lastLoginAt || null,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: json.email,
          passwordHash: user.passwordHash,
          name: json.name,
          role: json.role,
          status: json.status,
          lastLoginAt: json.lastLoginAt || null,
        },
      });
  }

  async findById(id: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0]!;
    return User.fromPrimitives({
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      name: row.name,
      role: row.role,
      status: row.status,
      createdAt: row.createdAt,
      lastLoginAt: row.lastLoginAt,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0]!;
    return User.fromPrimitives({
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      name: row.name,
      role: row.role,
      status: row.status,
      createdAt: row.createdAt,
      lastLoginAt: row.lastLoginAt,
    });
  }

  async findAll(): Promise<User[]> {
    const results = await db.select().from(users);

    return results.map((row) =>
      User.fromPrimitives({
        id: row.id,
        email: row.email,
        passwordHash: row.passwordHash,
        name: row.name,
        role: row.role,
        status: row.status,
        createdAt: row.createdAt,
        lastLoginAt: row.lastLoginAt,
      })
    );
  }

  async delete(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }
}
