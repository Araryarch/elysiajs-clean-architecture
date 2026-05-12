import { IPromoCodeRepository } from "../repository/promo-code-repository";
import { Query, QueryHandler } from "../../../shared/interfaces/query";

export type PromoCodeDTO = {
  id: string;
  eventId: string;
  code: string;
  type: string;
  discountValue: number;
  maxUsage: number;
  usedCount: number;
  validStart: string;
  validEnd: string;
  minPurchaseAmount?: number;
  currency: string;
  status: string;
  createdAt: string;
};

export class ListPromoCodesQuery implements Query {
  constructor(public readonly eventId: string) {}
}

export class ListPromoCodesHandler implements QueryHandler<ListPromoCodesQuery, PromoCodeDTO[]> {
  constructor(private promoCodeRepository: IPromoCodeRepository) {}

  async execute(query: ListPromoCodesQuery): Promise<PromoCodeDTO[]> {
    const promoCodes = await this.promoCodeRepository.findByEventId(query.eventId);

    return promoCodes.map((promoCode) => {
      const json = promoCode.toJSON();
      return {
        id: json.id,
        eventId: json.eventId,
        code: json.code,
        type: json.type,
        discountValue: json.discountValue,
        maxUsage: json.maxUsage,
        usedCount: json.usedCount,
        validStart: json.validPeriod.start.toISOString(),
        validEnd: json.validPeriod.end.toISOString(),
        minPurchaseAmount: json.minPurchaseAmount,
        currency: json.currency || "IDR",
        status: json.status,
        createdAt: json.createdAt.toISOString(),
      };
    });
  }
}
