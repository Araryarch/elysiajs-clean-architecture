export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string = "IDR"
  ) {
    if (amount < 0) throw new Error("Amount cannot be negative");
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) throw new Error("Currency mismatch");
    return new Money(this.amount + other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}
