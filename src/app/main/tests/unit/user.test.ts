import { describe, expect, it } from "bun:test";
import { User, UserRole, UserStatus } from "../../entities/auth/user";
import { Email } from "../../shared/utils/validation/email";

describe("User entity", () => {
  it("creates a user with Active status and hashed password", async () => {
    const user = await User.create({
      id: "user-1",
      email: "test@example.com",
      password: "password123",
      name: "Test User",
      role: UserRole.CUSTOMER,
    });
    expect(user.status).toBe(UserStatus.ACTIVE);
    expect(user.passwordHash).not.toBe("password123");
    expect(user.name).toBe("Test User");
  });

  it("throws when password is too short", async () => {
    await expect(
      User.create({
        id: "user-1",
        email: "test@example.com",
        password: "short",
        name: "Test User",
        role: UserRole.CUSTOMER,
      }),
    ).rejects.toThrow("Password must be at least 8 characters long");
  });

  it("verifies correct password", async () => {
    const user = await User.create({
      id: "user-1",
      email: "test@example.com",
      password: "password123",
      name: "Test User",
      role: UserRole.CUSTOMER,
    });
    expect(await user.verifyPassword("password123")).toBe(true);
    expect(await user.verifyPassword("wrong")).toBe(false);
  });

  it("updates password", async () => {
    const user = await User.create({
      id: "user-1",
      email: "test@example.com",
      password: "password123",
      name: "Test User",
      role: UserRole.CUSTOMER,
    });
    await user.updatePassword("newpassword123");
    expect(await user.verifyPassword("newpassword123")).toBe(true);
    expect(await user.verifyPassword("password123")).toBe(false);
  });

  it("throws when updating to short password", async () => {
    const user = await User.create({
      id: "user-1",
      email: "test@example.com",
      password: "password123",
      name: "Test User",
      role: UserRole.CUSTOMER,
    });
    await expect(user.updatePassword("short")).rejects.toThrow("Password must be at least 8 characters long");
  });

  it("updates last login", async () => {
    const user = await User.create({
      id: "user-1",
      email: "test@example.com",
      password: "password123",
      name: "Test User",
      role: UserRole.CUSTOMER,
    });
    user.updateLastLogin();
    expect(user.lastLoginAt).toBeInstanceOf(Date);
  });

  it("suspends a user", async () => {
    const user = await User.create({
      id: "user-1",
      email: "test@example.com",
      password: "password123",
      name: "Test User",
      role: UserRole.CUSTOMER,
    });
    user.suspend();
    expect(user.status).toBe(UserStatus.SUSPENDED);
  });

  it("throws when suspending already suspended user", async () => {
    const user = await User.create({
      id: "user-1",
      email: "test@example.com",
      password: "password123",
      name: "Test User",
      role: UserRole.CUSTOMER,
    });
    user.suspend();
    expect(() => user.suspend()).toThrow("User is already suspended");
  });

  it("activates a suspended user", async () => {
    const user = await User.create({
      id: "user-1",
      email: "test@example.com",
      password: "password123",
      name: "Test User",
      role: UserRole.CUSTOMER,
    });
    user.suspend();
    user.activate();
    expect(user.status).toBe(UserStatus.ACTIVE);
  });

  it("checks role helpers", async () => {
    const admin = await User.create({
      id: "user-admin",
      email: "admin@example.com",
      password: "password123",
      name: "Admin",
      role: UserRole.ADMIN,
    });
    const customer = await User.create({
      id: "user-cust",
      email: "cust@example.com",
      password: "password123",
      name: "Customer",
      role: UserRole.CUSTOMER,
    });

    expect(admin.isAdmin()).toBe(true);
    expect(admin.isOrganizer()).toBe(true);
    expect(customer.isAdmin()).toBe(false);
    expect(customer.isOrganizer()).toBe(false);
  });

  it("checks if user is active", async () => {
    const user = await User.create({
      id: "user-1",
      email: "test@example.com",
      password: "password123",
      name: "Test User",
      role: UserRole.CUSTOMER,
    });
    expect(user.isActive()).toBe(true);
    user.suspend();
    expect(user.isActive()).toBe(false);
  });

  it("serializes to JSON", async () => {
    const user = await User.create({
      id: "user-json-1",
      email: "json@example.com",
      password: "password123",
      name: "JSON User",
      role: UserRole.ADMIN,
    });
    const json = user.toJSON();
    expect(json.id).toBe("user-json-1");
    expect(json.email).toBe("json@example.com");
    expect(json.role).toBe(UserRole.ADMIN);
  });

  it("serializes to public JSON without sensitive data", async () => {
    const user = await User.create({
      id: "user-1",
      email: "test@example.com",
      password: "password123",
      name: "Test User",
      role: UserRole.CUSTOMER,
    });
    const pub = user.toPublicJSON();
    expect(pub.id).toBeDefined();
    expect((pub as any).passwordHash).toBeUndefined();
    expect((pub as any).status).toBeUndefined();
  });

  it("restores from primitives", () => {
    const user = User.fromPrimitives({
      id: "user-restore-1",
      email: "restore@example.com",
      passwordHash: "hashed123",
      name: "Restored",
      role: UserRole.ORGANIZER,
      status: UserStatus.ACTIVE,
      createdAt: new Date("2026-01-01"),
    });
    expect(user.id).toBe("user-restore-1");
    expect(user.role).toBe(UserRole.ORGANIZER);
  });
});
