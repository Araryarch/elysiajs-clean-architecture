import { nanoid } from "nanoid";

export class TicketCode {
  constructor(public readonly value: string) {
    if (!value || value.length < 8) throw new Error("Invalid ticket code");
  }

  static generate(): TicketCode {
    return new TicketCode(nanoid(12).toUpperCase());
  }

  equals(other: TicketCode): boolean {
    return this.value === other.value;
  }
}
