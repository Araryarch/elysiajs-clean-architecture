export interface IPasswordService {
  hash(plain: string): Promise<string>;
  verify(plain: string, hashed: string): Promise<boolean>;
}

export class PasswordService implements IPasswordService {
  async hash(plain: string): Promise<string> {
    return Bun.password.hash(plain, { algorithm: "bcrypt", cost: 10 });
  }

  async verify(plain: string, hashed: string): Promise<boolean> {
    return Bun.password.verify(plain, hashed);
  }
}
