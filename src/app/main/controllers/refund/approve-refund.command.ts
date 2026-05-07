import { NotFoundError } from "@/app/main/shared/errors/domain-error";
import { IRefundRepository } from "@/app/main/repositories/refund/refund-repository";
import { EventBus } from "@/app/main/shared/events/event-bus";
import { Command, CommandHandler } from "@/app/main/shared/interfaces/command";

export class ApproveRefundCommand implements Command {
  constructor(public readonly refundId: string) {}
}

export class ApproveRefundHandler implements CommandHandler<ApproveRefundCommand> {
  constructor(
    private readonly refundRepository: IRefundRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ApproveRefundCommand): Promise<void> {
    const refund = await this.refundRepository.findById(command.refundId);
    if (!refund) {
      throw new NotFoundError("Refund", command.refundId);
    }

    // Domain logic: validates status, emits RefundApproved domain event
    refund.approve();
    await this.refundRepository.save(refund);

    // Dispatch domain events — RefundApprovedTicketHandler reacts in the ticket context
    await this.eventBus.dispatchAll(refund.getDomainEvents());
    refund.clearDomainEvents();
  }
}
