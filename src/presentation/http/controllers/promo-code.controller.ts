import { Elysia, t, type TSchema } from "elysia";
import { CreatePromoCodeCommand, CreatePromoCodeHandler } from "@/application/commands/create-promo-code.command";
import { ValidatePromoCodeCommand, ValidatePromoCodeHandler } from "@/application/commands/validate-promo-code.command";
import { DeactivatePromoCodeCommand, DeactivatePromoCodeHandler } from "@/application/commands/deactivate-promo-code.command";
import { ListPromoCodesQuery, ListPromoCodesHandler } from "@/application/queries/list-promo-codes.query";
import { IPromoCodeRepository } from "@/domain/repositories/promo-code-repository";
import { EventRepository } from "@/domain/repositories/event-repository";
import { success } from "@/presentation/http/response";

const SuccessResponse = <T extends TSchema>(data: T) =>
  t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: data,
  });

const IdResponse = t.Object({ id: t.String() });
const NullResponse = t.Null();

const PromoCodeSchema = t.Object({
  id: t.String(),
  eventId: t.String(),
  code: t.String(),
  type: t.String(),
  discountValue: t.Number(),
  maxUsage: t.Number(),
  usedCount: t.Number(),
  validStart: t.String(),
  validEnd: t.String(),
  minPurchaseAmount: t.Optional(t.Number()),
  currency: t.String(),
  status: t.String(),
  createdAt: t.String(),
});

const ValidatePromoCodeSchema = t.Object({
  valid: t.Boolean(),
  promoCodeId: t.String(),
  discountAmount: t.Number(),
  finalAmount: t.Number(),
  message: t.Optional(t.String()),
});

export const createPromoCodeController = (deps: {
  promoCodeRepository: IPromoCodeRepository;
  eventRepository: EventRepository;
}) => {
  const createPromoCodeHandler = new CreatePromoCodeHandler(deps.promoCodeRepository, deps.eventRepository);
  const validatePromoCodeHandler = new ValidatePromoCodeHandler(deps.promoCodeRepository);
  const deactivatePromoCodeHandler = new DeactivatePromoCodeHandler(deps.promoCodeRepository);
  const listPromoCodesHandler = new ListPromoCodesHandler(deps.promoCodeRepository);

  return new Elysia({ prefix: "/api/v1" })
    .post(
      "/events/:id/promo-codes",
      async ({ params, body }) => {
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
        const promoCodeId = await createPromoCodeHandler.execute(command);
        return success({ id: promoCodeId }, "Promo code created successfully");
      },
      {
        body: t.Object({
          code: t.String({ minLength: 1 }),
          type: t.Union([t.Literal("Percentage"), t.Literal("FixedAmount")]),
          discountValue: t.Number({ minimum: 0 }),
          maxUsage: t.Number({ minimum: 1 }),
          validStart: t.String(),
          validEnd: t.String(),
          minPurchaseAmount: t.Optional(t.Number({ minimum: 0 })),
        }),
        response: {
          201: SuccessResponse(IdResponse),
        },
        detail: {
          summary: "Create Promo Code",
          description: "Create a new promo code for an event (Event Organizer only)",
          tags: ["Promo Codes"],
        },
      },
    )
    .get(
      "/events/:id/promo-codes",
      async ({ params }) => {
        const result = await listPromoCodesHandler.execute(new ListPromoCodesQuery(params.id));
        return success(result, "Promo codes retrieved successfully");
      },
      {
        response: {
          200: SuccessResponse(t.Array(PromoCodeSchema)),
        },
        detail: {
          summary: "List Promo Codes",
          description: "Get all promo codes for an event (Event Organizer only)",
          tags: ["Promo Codes"],
        },
      },
    )
    .post(
      "/promo-codes/validate",
      async ({ body }) => {
        const command = new ValidatePromoCodeCommand(
          body.eventId,
          body.code,
          body.purchaseAmount,
        );
        const result = await validatePromoCodeHandler.execute(command);
        return success(result, result.message || "Promo code validated");
      },
      {
        body: t.Object({
          eventId: t.String({ minLength: 1 }),
          code: t.String({ minLength: 1 }),
          purchaseAmount: t.Number({ minimum: 0 }),
        }),
        response: {
          200: SuccessResponse(ValidatePromoCodeSchema),
        },
        detail: {
          summary: "Validate Promo Code",
          description: "Validate a promo code and calculate discount",
          tags: ["Promo Codes"],
        },
      },
    )
    .post(
      "/promo-codes/:id/deactivate",
      async ({ params }) => {
        await deactivatePromoCodeHandler.execute(new DeactivatePromoCodeCommand(params.id));
        return success(null, "Promo code deactivated successfully");
      },
      {
        response: {
          200: SuccessResponse(NullResponse),
        },
        detail: {
          summary: "Deactivate Promo Code",
          description: "Deactivate a promo code (Event Organizer only)",
          tags: ["Promo Codes"],
        },
      },
    );
};
