import {
  Command,
  CommandHandler,
} from "../../../application/interfaces/command";
import { IUserRepository } from "../repository/user-repository";
import { DomainError } from "../../../domain/errors/domain-error";

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

export class LoginUserHandler implements CommandHandler<
  LoginUserCommand,
  LoginResult
> {
  constructor(private userRepository: IUserRepository) {}

  async execute(command: LoginUserCommand): Promise<LoginResult> {
    const user = await this.userRepository.findByEmail(command.email);
    if (!user) {
      throw new DomainError("Invalid email or password", 401);
    }

    if (!user.isActive()) {
      throw new DomainError("User account is not active", 403);
    }

    const isPasswordValid = await user.verifyPassword(command.password);
    if (!isPasswordValid) {
      throw new DomainError("Invalid email or password", 401);
    }

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
