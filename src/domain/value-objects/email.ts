export class Email {
  constructor(public readonly value: string) {
    if (!this.isValid(value)) throw new Error("Invalid email format");
  }

  private isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
