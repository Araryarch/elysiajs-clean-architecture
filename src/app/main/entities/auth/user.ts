import { Email } from "../../domain/value-objects/email";
import { DomainError } from "../../domain/errors/domain-error";
import bcrypt from "bcryptjs";

export enum UserRole {
  CUSTOMER = "Customer",
  ORGANIZER = "Organizer",
  ADMIN = "Admin",
}

export enum UserStatus {
  ACTIVE = "Active",
  INACTIVE = "Inactive",
  SUSPENDED = "Suspended",
}

export interface UserProps {
  id: string;
  email: Email;
  passwordHash: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  lastLoginAt?: Date;
}

export class User {
  private constructor(private props: UserProps) {}

  get id(): string {
    return this.props.id;
  }

  get email(): Email {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get name(): string {
    return this.props.name;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get status(): UserStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get lastLoginAt(): Date | undefined {
    return this.props.lastLoginAt;
  }

  static async create(props: {
    id: string;
    email: string;
    password: string;
    name: string;
    role: UserRole;
  }): Promise<User> {
    if (props.password.length < 8) {
      throw new DomainError("Password must be at least 8 characters long");
    }

    const passwordHash = await bcrypt.hash(props.password, 10);

    return new User({
      id: props.id,
      email: new Email(props.email),
      passwordHash,
      name: props.name,
      role: props.role,
      status: UserStatus.ACTIVE,
      createdAt: new Date(),
    });
  }

  async verifyPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.props.passwordHash);
  }

  async updatePassword(newPassword: string): Promise<void> {
    if (newPassword.length < 8) {
      throw new DomainError("Password must be at least 8 characters long");
    }

    this.props.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  updateLastLogin(): void {
    this.props.lastLoginAt = new Date();
  }

  suspend(): void {
    if (this.props.status === UserStatus.SUSPENDED) {
      throw new DomainError("User is already suspended");
    }

    this.props.status = UserStatus.SUSPENDED;
  }

  activate(): void {
    if (this.props.status === UserStatus.ACTIVE) {
      throw new DomainError("User is already active");
    }

    this.props.status = UserStatus.ACTIVE;
  }

  hasRole(role: UserRole): boolean {
    return this.props.role === role;
  }

  isAdmin(): boolean {
    return this.props.role === UserRole.ADMIN;
  }

  isOrganizer(): boolean {
    return (
      this.props.role === UserRole.ORGANIZER ||
      this.props.role === UserRole.ADMIN
    );
  }

  isActive(): boolean {
    return this.props.status === UserStatus.ACTIVE;
  }

  toJSON() {
    return {
      id: this.props.id,
      email: this.props.email.value,
      name: this.props.name,
      role: this.props.role,
      status: this.props.status,
      createdAt: this.props.createdAt,
      lastLoginAt: this.props.lastLoginAt,
    };
  }

  toPublicJSON() {
    return {
      id: this.props.id,
      email: this.props.email.value,
      name: this.props.name,
      role: this.props.role,
    };
  }

  static fromPrimitives(data: {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    role: string;
    status: string;
    createdAt: Date | string;
    lastLoginAt?: Date | string | null;
  }): User {
    return new User({
      id: data.id,
      email: new Email(data.email),
      passwordHash: data.passwordHash,
      name: data.name,
      role: data.role as UserRole,
      status: data.status as UserStatus,
      createdAt: new Date(data.createdAt),
      lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt) : undefined,
    });
  }
}
