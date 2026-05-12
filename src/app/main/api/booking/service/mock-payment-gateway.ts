import { IPaymentGateway } from "../../../application/interfaces/services";
import { createId } from "../../../application/id";

export function createMockPaymentGateway(): IPaymentGateway {
  return {
    async processPayment(params: {
      bookingId: string;
      amount: number;
    }): Promise<string> {
      console.log(
        `Processing payment for booking ${params.bookingId}: ${params.amount}`,
      );

      return `PAY-${createId("payment")}`;
    },
  };
}
