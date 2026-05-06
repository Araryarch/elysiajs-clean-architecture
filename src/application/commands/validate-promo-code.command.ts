import { Command, CommandHandler } from "@/application/commands/command";
import { IPromoCodeRepository } from "@/domain/repositories/promo-code-repository";
import { Money } from "@/domain/value-objects/money";
import { NotFoundError, DomainError } from "@/domain/errors/domain-error";

export class ValidatePromoCodeCommand implements Command {
  constructor(
    public readonly eventId: string,
    public readonly code: string,
    public readonly purchaseAmount: number,
  ) {}
}

export type ValidatePromoCodeResult = {
  valid: boolean;
  promoCodeId: string;
  discountAmount: number;
  finalAmount: number;
  message?: string;
};

export class ValidatePromoCodeHandler
  implements CommandHandler<ValidatePromoCodeCommand, ValidatePromoCodeResult>
{
  constructor(private promoCodeRepository: IPromoCodeRepository) {}

  async execute(command: ValidatePromoCodeCommand): Promise<ValidatePromoCodeResult> {
    const promoCode = await this.promoCodeRepository.findByCode(
      command.eventId,
      command.code.toUpperCase(),
    );

    if (!promoCode) {
      return {
        valid: false,
        promoCodeId: "",
        discountAmount: 0,
        finalAmount: command.purchaseAmount,
        message: "Promo code not found",
      };
    }

    if (!promoCode.canBeUsed()) {
      return {
        valid: false,
        promoCodeId: promoCode.id,
        discountAmount: 0,
        finalAmount: command.purchaseAmount,
        message: "Promo code is not valid or has expired",
      };
    }

    const purchaseAmount = new Money(command.purchaseAmount, "IDR");

    if (!promoCode.validateMinPurchase(purchaseAmount)) {
      return {
        valid: false,
        promoCodeId: promoCode.id,
        discountAmount: 0,
        finalAmount: command.purchaseAmount,
        message: `Minimum purchase amount is ${promoCode.minPurchaseAmount?.amount}`,
      };
    }

    const discount = promoCode.calculateDiscount(purchaseAmount);
    const finalAmount = Math.max(0, command.purchaseAmount - discount.amount);

    return {
      valid: true,
      promoCodeId: promoCode.id,
      discountAmount: discount.amount,
      finalAmount,
      message: "Promo code applied successfully",
    };
  }
}
