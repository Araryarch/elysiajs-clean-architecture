import { Money } from "@/domain/value-objects/money";
import { DateRange } from "@/domain/value-objects/date-range";
import { DomainError } from "@/domain/errors/domain-error";

export enum PromoCodeType {
  PERCENTAGE = "Percentage",
  FIXED_AMOUNT = "FixedAmount",
}

export enum PromoCodeStatus {
  ACTIVE = "Active",
  INACTIVE = "Inactive",
  EXPIRED = "Expired",
}

export interface PromoCodeProps {
  id: string;
  eventId: string;
  code: string;
  type: PromoCodeType;
  discountValue: number; // Percentage (0-100) or fixed amount
  maxUsage: number;
  usedCount: number;
  validPeriod: DateRange;
  minPurchaseAmount?: Money;
  status: PromoCodeStatus;
  createdAt: Date;
}

export class PromoCode {
  private constructor(private props: PromoCodeProps) {}

  get id(): string {
    return this.props.id;
  }

  get eventId(): string {
    return this.props.eventId;
  }

  get code(): string {
    return this.props.code;
  }

  get type(): PromoCodeType {
    return this.props.type;
  }

  get discountValue(): number {
    return this.props.discountValue;
  }

  get maxUsage(): number {
    return this.props.maxUsage;
  }

  get usedCount(): number {
    return this.props.usedCount;
  }

  get validPeriod(): DateRange {
    return this.props.validPeriod;
  }

  get minPurchaseAmount(): Money | undefined {
    return this.props.minPurchaseAmount;
  }

  get status(): PromoCodeStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  static create(props: Omit<PromoCodeProps, "usedCount" | "status" | "createdAt">): PromoCode {
    // Validate discount value
    if (props.type === PromoCodeType.PERCENTAGE && (props.discountValue < 0 || props.discountValue > 100)) {
      throw new DomainError("Percentage discount must be between 0 and 100");
    }

    if (props.type === PromoCodeType.FIXED_AMOUNT && props.discountValue < 0) {
      throw new DomainError("Fixed amount discount must be positive");
    }

    // Validate max usage
    if (props.maxUsage < 1) {
      throw new DomainError("Max usage must be at least 1");
    }

    return new PromoCode({
      ...props,
      usedCount: 0,
      status: PromoCodeStatus.ACTIVE,
      createdAt: new Date(),
    });
  }

  canBeUsed(): boolean {
    if (this.props.status !== PromoCodeStatus.ACTIVE) {
      return false;
    }

    if (this.props.usedCount >= this.props.maxUsage) {
      return false;
    }

    const now = new Date();
    if (!this.props.validPeriod.contains(now)) {
      return false;
    }

    return true;
  }

  validateMinPurchase(amount: Money): boolean {
    if (!this.props.minPurchaseAmount) {
      return true;
    }

    return amount.amount >= this.props.minPurchaseAmount.amount;
  }

  calculateDiscount(originalAmount: Money): Money {
    if (this.props.type === PromoCodeType.PERCENTAGE) {
      const discountAmount = (originalAmount.amount * this.props.discountValue) / 100;
      return new Money(discountAmount, originalAmount.currency);
    } else {
      // Fixed amount
      const discountAmount = Math.min(this.props.discountValue, originalAmount.amount);
      return new Money(discountAmount, originalAmount.currency);
    }
  }

  incrementUsage(): void {
    if (!this.canBeUsed()) {
      throw new DomainError("Promo code cannot be used");
    }

    this.props.usedCount += 1;

    // Auto-expire if max usage reached
    if (this.props.usedCount >= this.props.maxUsage) {
      this.props.status = PromoCodeStatus.EXPIRED;
    }
  }

  deactivate(): void {
    if (this.props.status === PromoCodeStatus.EXPIRED) {
      throw new DomainError("Cannot deactivate expired promo code");
    }

    this.props.status = PromoCodeStatus.INACTIVE;
  }

  activate(): void {
    if (this.props.status === PromoCodeStatus.EXPIRED) {
      throw new DomainError("Cannot activate expired promo code");
    }

    this.props.status = PromoCodeStatus.ACTIVE;
  }

  toJSON() {
    return {
      id: this.props.id,
      eventId: this.props.eventId,
      code: this.props.code,
      type: this.props.type,
      discountValue: this.props.discountValue,
      maxUsage: this.props.maxUsage,
      usedCount: this.props.usedCount,
      validPeriod: {
        start: this.props.validPeriod.start,
        end: this.props.validPeriod.end,
      },
      minPurchaseAmount: this.props.minPurchaseAmount?.amount,
      currency: this.props.minPurchaseAmount?.currency,
      status: this.props.status,
      createdAt: this.props.createdAt,
    };
  }

  static fromPrimitives(data: {
    id: string;
    eventId: string;
    code: string;
    type: string;
    discountValue: number;
    maxUsage: number;
    usedCount: number;
    validStart: Date | string;
    validEnd: Date | string;
    minPurchaseAmount?: number | null;
    currency?: string;
    status: string;
    createdAt: Date | string;
  }): PromoCode {
    return new PromoCode({
      id: data.id,
      eventId: data.eventId,
      code: data.code,
      type: data.type as PromoCodeType,
      discountValue: data.discountValue,
      maxUsage: data.maxUsage,
      usedCount: data.usedCount,
      validPeriod: new DateRange(new Date(data.validStart), new Date(data.validEnd)),
      minPurchaseAmount: data.minPurchaseAmount
        ? new Money(data.minPurchaseAmount, data.currency || "IDR")
        : undefined,
      status: data.status as PromoCodeStatus,
      createdAt: new Date(data.createdAt),
    });
  }
}
