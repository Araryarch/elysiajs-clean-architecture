import { NotFoundError } from "@/app/main/shared/errors/domain-error";
import { IRefundRepository } from "@/app/main/repositories/refund/refund-repository";
import { IRefundPaymentService } from "@/app/main/services/interfaces";
import { Command, CommandHandler } from "@/app/main/shared/interfaces/command";

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

    // Process refund payment
    const paymentRef = await this.refundPaymentService.processRefund({
      refundId: refund.id,
      amount: refund.toJSON().amount,
    });

    refund.markAsPaidOut(paymentRef);
    await this.refundRepository.save(refund);
  }
}
