import { Command, CommandHandler } from "@/application/commands/command";
import { IPromoCodeRepository } from "@/domain/repositories/promo-code-repository";
import { NotFoundError } from "@/domain/errors/domain-error";

export class DeactivatePromoCodeCommand implements Command {
  constructor(public readonly promoCodeId: string) {}
}

export class DeactivatePromoCodeHandler implements CommandHandler<DeactivatePromoCodeCommand, void> {
  constructor(private promoCodeRepository: IPromoCodeRepository) {}

  async execute(command: DeactivatePromoCodeCommand): Promise<void> {
    const promoCode = await this.promoCodeRepository.findById(command.promoCodeId);

    if (!promoCode) {
      throw new NotFoundError("Promo code", command.promoCodeId);
    }

    promoCode.deactivate();

    await this.promoCodeRepository.save(promoCode);
  }
}
