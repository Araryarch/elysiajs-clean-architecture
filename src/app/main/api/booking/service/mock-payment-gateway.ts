import { IPaymentGateway } from "../../../shared/interfaces/services";
import { createId } from "../../../shared/utils/helpers/id";

export function createMockPaymentGateway(): IPaymentGateway {
  return {
    async processPayment(params: { bookingId: string; amount: number }): Promise<string> {

      console.log(`Processing payment for booking ${params.bookingId}: ${params.amount}`);

      return `PAY-${createId("payment")}`;
    },
  };
}

