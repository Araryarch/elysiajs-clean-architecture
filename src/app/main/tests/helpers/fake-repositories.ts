import type { EventRepository } from "../../api/event/repository/event-repository";
import type { BookingRepository } from "../../api/booking/repository/booking-repository";
import type { ITicketRepository } from "../../api/ticket/repository/ticket-repository";
import type { IRefundRepository } from "../../api/refund/repository/refund-repository";
import type { IPromoCodeRepository } from "../../api/promo-code/repository/promo-code-repository";
import type { IUserRepository } from "../../api/auth/repository/user-repository";
import type { Event } from "../../entities/event/event";
import type { Booking } from "../../entities/booking/booking";
import type { Ticket } from "../../entities/ticket/ticket";
import type { Refund } from "../../entities/refund/refund";
import type { PromoCode } from "../../entities/promo-code/promo-code";
import type { User } from "../../entities/auth/user";

export class FakeEventRepository implements EventRepository {
  protected store = new Map<string, Event>();

  async findAll(): Promise<Event[]> {
    return [...this.store.values()];
  }

  async findById(id: string): Promise<Event | null> {
    return this.store.get(id) ?? null;
  }

  async save(event: Event): Promise<void> {
    this.store.set(event.id, event);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}

export class FakeBookingRepository implements BookingRepository {
  protected store = new Map<string, Booking>();

  async findAll(): Promise<Booking[]> {
    return [...this.store.values()];
  }

  async findById(id: string): Promise<Booking | null> {
    return this.store.get(id) ?? null;
  }

  async findByEventId(eventId: string): Promise<Booking[]> {
    return [...this.store.values()].filter((b) => b.eventId === eventId);
  }

  async findByCustomerEmail(email: string): Promise<Booking[]> {
    return [...this.store.values()].filter(
      (b) => b.toJSON().customerEmail.toLowerCase() === email.toLowerCase(),
    );
  }

  async findByEventAndCustomer(eventId: string, email: string): Promise<Booking[]> {
    return [...this.store.values()].filter(
      (b) =>
        b.eventId === eventId &&
        b.toJSON().customerEmail.toLowerCase() === email.toLowerCase(),
    );
  }

  async save(booking: Booking): Promise<void> {
    this.store.set(booking.id, booking);
  }
}

export class FakeTicketRepository implements ITicketRepository {
  protected store = new Map<string, Ticket>();

  async findAll(): Promise<Ticket[]> {
    return [...this.store.values()];
  }

  async findById(id: string): Promise<Ticket | null> {
    return this.store.get(id) ?? null;
  }

  async findByCode(code: string): Promise<Ticket | null> {
    return [...this.store.values()].find((t) => t.toJSON().ticketCode === code) ?? null;
  }

  async findByBookingId(bookingId: string): Promise<Ticket[]> {
    return [...this.store.values()].filter((t) => t.toJSON().bookingId === bookingId);
  }

  async findByEventId(eventId: string): Promise<Ticket[]> {
    return [...this.store.values()].filter((t) => t.toJSON().eventId === eventId);
  }

  async save(ticket: Ticket): Promise<void> {
    this.store.set(ticket.id, ticket);
  }
}

export class FakeRefundRepository implements IRefundRepository {
  protected store = new Map<string, Refund>();

  async findAll(): Promise<Refund[]> {
    return [...this.store.values()];
  }

  async findById(id: string): Promise<Refund | null> {
    return this.store.get(id) ?? null;
  }

  async findByBookingId(bookingId: string): Promise<Refund[]> {
    return [...this.store.values()].filter((r) => r.toJSON().bookingId === bookingId);
  }

  async save(refund: Refund): Promise<void> {
    this.store.set(refund.id, refund);
  }
}

export class FakePromoCodeRepository implements IPromoCodeRepository {
  protected store = new Map<string, PromoCode>();

  async findAll(): Promise<PromoCode[]> {
    return [...this.store.values()];
  }

  async findById(id: string): Promise<PromoCode | null> {
    return this.store.get(id) ?? null;
  }

  async findByCode(eventId: string, code: string): Promise<PromoCode | null> {
    return [...this.store.values()].find(
      (p) => p.eventId === eventId && p.code === code,
    ) ?? null;
  }

  async findByEventId(eventId: string): Promise<PromoCode[]> {
    return [...this.store.values()].filter((p) => p.eventId === eventId);
  }

  async save(promoCode: PromoCode): Promise<void> {
    this.store.set(promoCode.id, promoCode);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}

export class FakeUserRepository implements IUserRepository {
  protected store = new Map<string, User>();

  async findAll(): Promise<User[]> {
    return [...this.store.values()];
  }

  async findById(id: string): Promise<User | null> {
    return this.store.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return [...this.store.values()].find(
      (u) => u.email.value.toLowerCase() === email.toLowerCase(),
    ) ?? null;
  }

  async save(user: User): Promise<void> {
    this.store.set(user.id, user);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}

export function createFakeRepositories() {
  return {
    eventRepo: new FakeEventRepository(),
    bookingRepo: new FakeBookingRepository(),
    ticketRepo: new FakeTicketRepository(),
    refundRepo: new FakeRefundRepository(),
    promoCodeRepo: new FakePromoCodeRepository(),
    userRepo: new FakeUserRepository(),
  };
}
