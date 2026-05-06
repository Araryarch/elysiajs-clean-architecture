import { IRefundPaymentService } from "@/application/services/interfaces";
import { createId } from "@/shared/id";

export function createMockRefundPaymentService(): IRefundPaymentService {
  return {
    async processRefund(params: { refundId: string; amount: number }): Promise<string> {
      // Simulate refund processing
      console.log(`Processing refund ${params.refundId}: ${params.amount}`);

      // In real implementation, this would call bank/payment service API
      // For now, just return a mock payment reference
      return `REF-${createId("refund")}`;
    },
  };
}
