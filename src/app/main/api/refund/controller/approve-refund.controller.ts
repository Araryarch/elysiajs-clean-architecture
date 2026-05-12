import { NotFoundError } from "../../../shared/errors/domain-error";
import { IRefundRepository } from "../repository/refund-repository";
import { EventBus } from "../../../shared/events/event-bus";
import { Command, CommandHandler } from "../../../shared/interfaces/command";

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

    refund.approve();
    await this.refundRepository.save(refund);

    await this.eventBus.dispatchAll(refund.getDomainEvents());
    refund.clearDomainEvents();
  }
}

