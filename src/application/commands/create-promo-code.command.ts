import { Command, CommandHandler } from "@/application/commands/command";
import { IPromoCodeRepository } from "@/domain/repositories/promo-code-repository";
import { EventRepository } from "@/domain/repositories/event-repository";
import { PromoCode, PromoCodeType } from "@/domain/entities/promo-code";
import { DateRange } from "@/domain/value-objects/date-range";
import { Money } from "@/domain/value-objects/money";
import { NotFoundError, DomainError } from "@/domain/errors/domain-error";
import { createId } from "@/shared/id";

export class CreatePromoCodeCommand implements Command {
  constructor(
    public readonly eventId: string,
    public readonly code: string,
    public readonly type: string,
    public readonly discountValue: number,
    public readonly maxUsage: number,
    public readonly validStart: Date,
    public readonly validEnd: Date,
    public readonly minPurchaseAmount?: number,
  ) {}
}

export class CreatePromoCodeHandler implements CommandHandler<CreatePromoCodeCommand, string> {
  constructor(
    private promoCodeRepository: IPromoCodeRepository,
    private eventRepository: EventRepository,
  ) {}

  async execute(command: CreatePromoCodeCommand): Promise<string> {
    // Verify event exists
    const event = await this.eventRepository.findById(command.eventId);
    if (!event) {
      throw new NotFoundError("Event", command.eventId);
    }

    // Check if promo code already exists
    const existing = await this.promoCodeRepository.findByCode(command.eventId, command.code);
    if (existing) {
      throw new DomainError("Promo code already exists for this event");
    }

    // Validate promo code type
    const type = command.type === "Percentage" ? PromoCodeType.PERCENTAGE : PromoCodeType.FIXED_AMOUNT;

    const promoCode = PromoCode.create({
      id: createId("promo"),
      eventId: command.eventId,
      code: command.code.toUpperCase(),
      type,
      discountValue: command.discountValue,
      maxUsage: command.maxUsage,
      validPeriod: new DateRange(command.validStart, command.validEnd),
      minPurchaseAmount: command.minPurchaseAmount
        ? new Money(command.minPurchaseAmount, "IDR")
        : undefined,
    });

    await this.promoCodeRepository.save(promoCode);

    return promoCode.id;
  }
}
