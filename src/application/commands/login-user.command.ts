import { Command, CommandHandler } from "@/application/commands/command";
import { IUserRepository } from "@/domain/repositories/user-repository";
import { DomainError } from "@/domain/errors/domain-error";

export class LoginUserCommand implements Command {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {}
}

export type LoginResult = {
  userId: string;
  email: string;
  name: string;
  role: string;
};

export class LoginUserHandler implements CommandHandler<LoginUserCommand, LoginResult> {
  constructor(private userRepository: IUserRepository) {}

  async execute(command: LoginUserCommand): Promise<LoginResult> {
    // Find user by email
    const user = await this.userRepository.findByEmail(command.email);
    if (!user) {
      throw new DomainError("Invalid email or password", 401);
    }

    // Check if user is active
    if (!user.isActive()) {
      throw new DomainError("User account is not active", 403);
    }

    // Verify password
    const isPasswordValid = await user.verifyPassword(command.password);
    if (!isPasswordValid) {
      throw new DomainError("Invalid email or password", 401);
    }

    // Update last login
    user.updateLastLogin();
    await this.userRepository.save(user);

    return {
      userId: user.id,
      email: user.email.value,
      name: user.name,
      role: user.role,
    };
  }
}
