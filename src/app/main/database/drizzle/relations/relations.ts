import { relations } from "drizzle-orm";
import {
  events,
  ticketCategories,
  bookings,
  bookingItems,
  tickets,
  refunds,
  promoCodes,
  waitlist,
} from "../schema/schema";

export const eventsRelations = relations(events, ({ many }) => ({
  ticketCategories: many(ticketCategories),
  bookings: many(bookings),
  tickets: many(tickets),
  promoCodes: many(promoCodes),
  waitlist: many(waitlist),
}));

export const ticketCategoriesRelations = relations(
  ticketCategories,
  ({ one, many }) => ({
    event: one(events, {
      fields: [ticketCategories.eventId],
      references: [events.id],
    }),
    bookingItems: many(bookingItems),
    tickets: many(tickets),
  }),
);

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  event: one(events, {
    fields: [bookings.eventId],
    references: [events.id],
  }),
  items: many(bookingItems),
  tickets: many(tickets),
  refunds: many(refunds),
}));

export const bookingItemsRelations = relations(bookingItems, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingItems.bookingId],
    references: [bookings.id],
  }),
  ticketCategory: one(ticketCategories, {
    fields: [bookingItems.ticketCategoryId],
    references: [ticketCategories.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  booking: one(bookings, {
    fields: [tickets.bookingId],
    references: [bookings.id],
  }),
  event: one(events, {
    fields: [tickets.eventId],
    references: [events.id],
  }),
  ticketCategory: one(ticketCategories, {
    fields: [tickets.ticketCategoryId],
    references: [ticketCategories.id],
  }),
}));

export const refundsRelations = relations(refunds, ({ one }) => ({
  booking: one(bookings, {
    fields: [refunds.bookingId],
    references: [bookings.id],
  }),
}));

export const promoCodesRelations = relations(promoCodes, ({ one }) => ({
  event: one(events, {
    fields: [promoCodes.eventId],
    references: [events.id],
  }),
}));

export const waitlistRelations = relations(waitlist, ({ one }) => ({
  event: one(events, {
    fields: [waitlist.eventId],
    references: [events.id],
  }),
  ticketCategory: one(ticketCategories, {
    fields: [waitlist.ticketCategoryId],
    references: [ticketCategories.id],
  }),
}));
