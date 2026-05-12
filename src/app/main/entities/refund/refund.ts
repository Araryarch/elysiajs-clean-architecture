import { DomainError } from "../../domain/errors/domain-error";
import { DomainEvent } from "../../domain/events/domain-event";
import { RefundApproved, RefundPaidOut, RefundRejected, RefundRequested } from "../../domain/events/events";
import { Money } from "../../domain/value-objects/money";
import { RefundStatus } from "./refund-status";

export type RefundProps = {
  id: string;
  bookingId: string;
  amount: Money;
  status: RefundStatus;
  requestedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  paidOutAt?: Date;
  rejectionReason?: string;
  paymentReference?: string;
};

export class Refund {
  private domainEvents: DomainEvent[] = [];

  constructor(private props: RefundProps) {}

  get id() {
    return this.props.id;
  }

  get status() {
    return this.props.status;
  }

  get bookingId() {
    return this.props.bookingId;
  }

  getDomainEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  clearDomainEvents() {
    this.domainEvents = [];
  }

  approve(now: Date = new Date()) {
    if (this.props.status !== RefundStatus.REQUESTED) {
      throw new DomainError("Only requested refund can be approved");
    }

    this.props.status = RefundStatus.APPROVED;
    this.props.approvedAt = now;
    this.domainEvents.push(new RefundApproved(this.props.id));
  }

  reject(reason: string, now: Date = new Date()) {
    if (this.props.status !== RefundStatus.REQUESTED) {
      throw new DomainError("Only requested refund can be rejected");
    }
    if (!reason || !reason.trim()) {
      throw new DomainError("Rejection reason is required");
    }

    this.props.status = RefundStatus.REJECTED;
    this.props.rejectedAt = now;
    this.props.rejectionReason = reason;
    this.domainEvents.push(new RefundRejected(this.props.id, reason));
  }

  markAsPaidOut(paymentReference: string, now: Date = new Date()) {
    if (this.props.status !== RefundStatus.APPROVED) {
      throw new DomainError("Only approved refund can be paid out");
    }
    if (!paymentReference || !paymentReference.trim()) {
      throw new DomainError("Payment reference is required");
    }

    this.props.status = RefundStatus.PAID_OUT;
    this.props.paidOutAt = now;
    this.props.paymentReference = paymentReference;
    this.domainEvents.push(new RefundPaidOut(this.props.id, paymentReference));
  }

  toJSON() {
    return {
      id: this.props.id,
      bookingId: this.props.bookingId,
      amount: this.props.amount.amount,
      currency: this.props.amount.currency,
      status: this.props.status,
      requestedAt: this.props.requestedAt,
      approvedAt: this.props.approvedAt,
      rejectedAt: this.props.rejectedAt,
      paidOutAt: this.props.paidOutAt,
      rejectionReason: this.props.rejectionReason,
      paymentReference: this.props.paymentReference,
    };
  }

  static create(props: Omit<RefundProps, "status" | "requestedAt">): Refund {
    const refund = new Refund({
      ...props,
      status: RefundStatus.REQUESTED,
      requestedAt: new Date(),
    });
    refund.domainEvents.push(new RefundRequested(props.id, props.bookingId));
    return refund;
  }

  static fromPrimitives(data: {
    id: string;
    bookingId: string;
    amount: number;
    currency: string;
    status: string;
    requestedAt: Date | string;
    approvedAt?: Date | string | null;
    rejectedAt?: Date | string | null;
    paidOutAt?: Date | string | null;
    rejectionReason?: string | null;
    paymentReference?: string | null;
  }): Refund {
    return new Refund({
      id: data.id,
      bookingId: data.bookingId,
      amount: new Money(data.amount, data.currency || "IDR"),
      status: data.status as RefundStatus,
      requestedAt: new Date(data.requestedAt),
      approvedAt: data.approvedAt ? new Date(data.approvedAt) : undefined,
      rejectedAt: data.rejectedAt ? new Date(data.rejectedAt) : undefined,
      paidOutAt: data.paidOutAt ? new Date(data.paidOutAt) : undefined,
      rejectionReason: data.rejectionReason || undefined,
      paymentReference: data.paymentReference || undefined,
    });
  }
}


