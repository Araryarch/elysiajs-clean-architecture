import { DomainError } from "@/domain/errors/domain-error";

export enum WaitlistStatus {
  WAITING = "Waiting",
  NOTIFIED = "Notified",
  CONVERTED = "Converted",
  CANCELLED = "Cancelled",
}

export interface WaitlistProps {
  id: string;
  eventId: string;
  customerName: string;
  customerEmail: string;
  ticketCategoryId?: string;
  quantity: number;
  status: WaitlistStatus;
  joinedAt: Date;
  notifiedAt?: Date;
}

export class Waitlist {
  private constructor(private props: WaitlistProps) {}

  get id(): string {
    return this.props.id;
  }

  get eventId(): string {
    return this.props.eventId;
  }

  get customerName(): string {
    return this.props.customerName;
  }

  get customerEmail(): string {
    return this.props.customerEmail;
  }

  get ticketCategoryId(): string | undefined {
    return this.props.ticketCategoryId;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get status(): WaitlistStatus {
    return this.props.status;
  }

  get joinedAt(): Date {
    return this.props.joinedAt;
  }

  get notifiedAt(): Date | undefined {
    return this.props.notifiedAt;
  }

  static create(
    props: Omit<WaitlistProps, "status" | "joinedAt" | "notifiedAt">,
  ): Waitlist {
    if (props.quantity < 1) {
      throw new DomainError("Quantity must be at least 1");
    }

    return new Waitlist({
      ...props,
      status: WaitlistStatus.WAITING,
      joinedAt: new Date(),
    });
  }

  notify(): void {
    if (this.props.status !== WaitlistStatus.WAITING) {
      throw new DomainError("Can only notify waiting customers");
    }

    this.props.status = WaitlistStatus.NOTIFIED;
    this.props.notifiedAt = new Date();
  }

  convert(): void {
    if (this.props.status !== WaitlistStatus.NOTIFIED) {
      throw new DomainError("Can only convert notified customers");
    }

    this.props.status = WaitlistStatus.CONVERTED;
  }

  cancel(): void {
    if (this.props.status === WaitlistStatus.CONVERTED) {
      throw new DomainError("Cannot cancel converted waitlist entry");
    }

    this.props.status = WaitlistStatus.CANCELLED;
  }

  toJSON() {
    return {
      id: this.props.id,
      eventId: this.props.eventId,
      customerName: this.props.customerName,
      customerEmail: this.props.customerEmail,
      ticketCategoryId: this.props.ticketCategoryId,
      quantity: this.props.quantity,
      status: this.props.status,
      joinedAt: this.props.joinedAt,
      notifiedAt: this.props.notifiedAt,
    };
  }

  static fromPrimitives(data: {
    id: string;
    eventId: string;
    customerName: string;
    customerEmail: string;
    ticketCategoryId?: string | null;
    quantity: number;
    status: string;
    joinedAt: Date | string;
    notifiedAt?: Date | string | null;
  }): Waitlist {
    return new Waitlist({
      id: data.id,
      eventId: data.eventId,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      ticketCategoryId: data.ticketCategoryId || undefined,
      quantity: data.quantity,
      status: data.status as WaitlistStatus,
      joinedAt: new Date(data.joinedAt),
      notifiedAt: data.notifiedAt ? new Date(data.notifiedAt) : undefined,
    });
  }
}
