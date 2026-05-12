import { PromoCode, PromoCodeType } from "../../../entities/promo-code/promo-code";

export interface PromoValidationResult {
  valid: boolean;
  discountAmount: number;
  finalAmount: number;
  message: string;
}

export interface IPromoValidatorService {
  validate(promoCode: PromoCode, purchaseAmount: number): PromoValidationResult;
  apply(promoCode: PromoCode, purchaseAmount: number): PromoValidationResult;
}

export class PromoValidatorService implements IPromoValidatorService {
  validate(promoCode: PromoCode, purchaseAmount: number): PromoValidationResult {
    if (!promoCode.canBeUsed()) {
      return { valid: false, discountAmount: 0, finalAmount: purchaseAmount, message: "Promo code is not valid or has expired" };
    }

    if (promoCode.minPurchaseAmount && purchaseAmount < promoCode.minPurchaseAmount.amount) {
      return {
        valid: false,
        discountAmount: 0,
        finalAmount: purchaseAmount,
        message: `Minimum purchase amount is ${promoCode.minPurchaseAmount.amount}`,
      };
    }

    const discount = this.computeDiscount(promoCode, purchaseAmount);
    return {
      valid: true,
      discountAmount: discount,
      finalAmount: Math.max(0, purchaseAmount - discount),
      message: "Promo code is valid",
    };
  }

  apply(promoCode: PromoCode, purchaseAmount: number): PromoValidationResult {
    const result = this.validate(promoCode, purchaseAmount);
    if (result.valid) {
      promoCode.incrementUsage();
    }
    return result;
  }

  private computeDiscount(promoCode: PromoCode, amount: number): number {
    if (promoCode.type === PromoCodeType.PERCENTAGE) {
      return Math.round((amount * promoCode.discountValue) / 100);
    }
    return Math.min(promoCode.discountValue, amount);
  }
}
