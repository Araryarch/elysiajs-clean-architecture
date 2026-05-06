import { IPaymentGateway } from "@/application/services/interfaces";
import { createId } from "@/shared/id";

export function createMockPaymentGateway(): IPaymentGateway {
  return {
    async processPayment(params: { bookingId: string; amount: number }): Promise<string> {
      // Simulate payment processing
      console.log(`Processing payment for booking ${params.bookingId}: ${params.amount}`);

      // In real implementation, this would call external payment gateway API
      // For now, just return a mock payment reference
      return `PAY-${createId("payment")}`;
    },
  };
}
