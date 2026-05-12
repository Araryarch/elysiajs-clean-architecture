import { NotFoundError } from "../../../shared/errors/domain-error";
import { IRefundRepository } from "../repository/refund-repository";
import { Command, CommandHandler } from "../../../shared/interfaces/command";

export class RejectRefundCommand implements Command {
  constructor(
    public readonly refundId: string,
    public readonly reason: string,
  ) {}
}

export class RejectRefundHandler implements CommandHandler<RejectRefundCommand> {
  constructor(private refundRepository: IRefundRepository) {}

  async execute(command: RejectRefundCommand): Promise<void> {
    const refund = await this.refundRepository.findById(command.refundId);
    if (!refund) {
      throw new NotFoundError("Refund", command.refundId);
    }

    refund.reject(command.reason);
    await this.refundRepository.save(refund);
  }
}
