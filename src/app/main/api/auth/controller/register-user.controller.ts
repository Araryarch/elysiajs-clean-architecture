import {
  Command,
  CommandHandler,
} from "../../../application/interfaces/command";
import { IUserRepository } from "../repository/user-repository";
import { User, UserRole } from "../../../entities/auth/user";
import { DomainError } from "../../../domain/errors/domain-error";
import { createId } from "../../../application/id";

export class RegisterUserCommand implements Command {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly name: string,
    public readonly role: string = "Customer",
  ) {}
}

export class RegisterUserHandler implements CommandHandler<
  RegisterUserCommand,
  string
> {
  constructor(private userRepository: IUserRepository) {}

  async execute(command: RegisterUserCommand): Promise<string> {
    const existingUser = await this.userRepository.findByEmail(command.email);
    if (existingUser) {
      throw new DomainError("User with this email already exists", 409);
    }

    const role = command.role as UserRole;
    if (!Object.values(UserRole).includes(role)) {
      throw new DomainError("Invalid user role");
    }

    const user = await User.create({
      id: createId("usr"),
      email: command.email,
      password: command.password,
      name: command.name,
      role,
    });

    await this.userRepository.save(user);

    return user.id;
  }
}
