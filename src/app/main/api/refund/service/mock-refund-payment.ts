import { IRefundPaymentService } from "../../../application/interfaces/services";
import { createId } from "../../../application/id";

export function createMockRefundPaymentService(): IRefundPaymentService {
  return {
    async processRefund(params: {
      refundId: string;
      amount: number;
    }): Promise<string> {
      console.log(`Processing refund ${params.refundId}: ${params.amount}`);

      return `REF-${createId("refund")}`;
    },
  };
}
