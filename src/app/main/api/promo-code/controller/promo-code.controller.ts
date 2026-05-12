import { CreatePromoCodeCommand } from "./create-promo-code.controller";
import { ValidatePromoCodeCommand } from "./validate-promo-code.controller";
import { DeactivatePromoCodeCommand } from "./deactivate-promo-code.controller";
import { ListPromoCodesQuery } from "./list-promo-codes.controller";
import type { CreatePromoCodeHandler } from "./create-promo-code.controller";
import type { ValidatePromoCodeHandler } from "./validate-promo-code.controller";
import type { DeactivatePromoCodeHandler } from "./deactivate-promo-code.controller";
import type { ListPromoCodesHandler } from "./list-promo-codes.controller";
import { success } from "../../../middlewares/response/response";

export type PromoCodeControllerHandlers = {
  createPromoCodeHandler: CreatePromoCodeHandler;
  validatePromoCodeHandler: ValidatePromoCodeHandler;
  deactivatePromoCodeHandler: DeactivatePromoCodeHandler;
  listPromoCodesHandler: ListPromoCodesHandler;
};

export const createPromoCodeController = (
  handlers: PromoCodeControllerHandlers,
) => ({
  create(
    params: { id: string },
    body: {
      code: string;
      type: "Percentage" | "FixedAmount";
      discountValue: number;
      maxUsage: number;
      validStart: string;
      validEnd: string;
      minPurchaseAmount?: number;
    },
  ) {
    const command = new CreatePromoCodeCommand(
      params.id,
      body.code,
      body.type,
      body.discountValue,
      body.maxUsage,
      new Date(body.validStart),
      new Date(body.validEnd),
      body.minPurchaseAmount,
    );
    return handlers.createPromoCodeHandler
      .execute(command)
      .then((promoCodeId) =>
        success({ id: promoCodeId }, "Promo code created successfully"),
      );
  },

  list(params: { id: string }) {
    return handlers.listPromoCodesHandler
      .execute(new ListPromoCodesQuery(params.id))
      .then((result) => success(result, "Promo codes retrieved successfully"));
  },

  validate(body: { eventId: string; code: string; purchaseAmount: number }) {
    return handlers.validatePromoCodeHandler
      .execute(
        new ValidatePromoCodeCommand(
          body.eventId,
          body.code,
          body.purchaseAmount,
        ),
      )
      .then((result) =>
        success(result, result.message || "Promo code validated"),
      );
  },

  deactivate(params: { id: string }) {
    return handlers.deactivatePromoCodeHandler
      .execute(new DeactivatePromoCodeCommand(params.id))
      .then(() => success(null, "Promo code deactivated successfully"));
  },
});

export type PromoCodeController = ReturnType<typeof createPromoCodeController>;
