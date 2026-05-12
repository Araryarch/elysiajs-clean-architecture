import { NotFoundError } from "../../../shared/errors/domain-error";
import { IRefundRepository } from "../repository/refund-repository";
import { IRefundPaymentService } from "../../../shared/interfaces/services";
import { Command, CommandHandler } from "../../../shared/interfaces/command";

export class PayoutRefundCommand implements Command {
  constructor(public readonly refundId: string) {}
}

export class PayoutRefundHandler implements CommandHandler<PayoutRefundCommand> {
  constructor(
    private refundRepository: IRefundRepository,
    private refundPaymentService: IRefundPaymentService,
  ) {}

  async execute(command: PayoutRefundCommand): Promise<void> {
    const refund = await this.refundRepository.findById(command.refundId);
    if (!refund) {
      throw new NotFoundError("Refund", command.refundId);
    }

    const paymentRef = await this.refundPaymentService.processRefund({
      refundId: refund.id,
      amount: refund.toJSON().amount,
    });

    refund.markAsPaidOut(paymentRef);
    await this.refundRepository.save(refund);
  }
}

