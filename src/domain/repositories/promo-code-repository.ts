import { PromoCode } from "@/domain/entities/promo-code";

export interface IPromoCodeRepository {
  save(promoCode: PromoCode): Promise<void>;
  findById(id: string): Promise<PromoCode | null>;
  findByCode(eventId: string, code: string): Promise<PromoCode | null>;
  findByEventId(eventId: string): Promise<PromoCode[]>;
  findAll(): Promise<PromoCode[]>;
  delete(id: string): Promise<void>;
}
