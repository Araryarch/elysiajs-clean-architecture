import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  decimal,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(), // Customer, Organizer, Admin
  status: text("status").notNull(), // Active, Inactive, Suspended
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

export const events = pgTable("events", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  venue: text("venue").notNull(),
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at").notNull(),
  maxCapacity: integer("max_capacity").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const ticketCategories = pgTable("ticket_categories", {
  id: text("id").primaryKey(),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id),
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("IDR"),
  quota: integer("quota").notNull(),
  bookedQuantity: integer("booked_quantity").notNull().default(0),
  salesStart: timestamp("sales_start").notNull(),
  salesEnd: timestamp("sales_end").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const bookings = pgTable("bookings", {
  id: text("id").primaryKey(),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("IDR"),
  status: text("status").notNull(),
  paymentDeadline: timestamp("payment_deadline").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  paidAt: timestamp("paid_at"),
});

export const bookingItems = pgTable("booking_items", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id")
    .notNull()
    .references(() => bookings.id),
  ticketCategoryId: text("ticket_category_id")
    .notNull()
    .references(() => ticketCategories.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("IDR"),
});

export const tickets = pgTable("tickets", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id")
    .notNull()
    .references(() => bookings.id),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id),
  ticketCategoryId: text("ticket_category_id")
    .notNull()
    .references(() => ticketCategories.id),
  ticketCode: text("ticket_code").notNull().unique(),
  customerName: text("customer_name").notNull(),
  status: text("status").notNull(),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
  checkedInAt: timestamp("checked_in_at"),
});

export const refunds = pgTable("refunds", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id")
    .notNull()
    .references(() => bookings.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("IDR"),
  status: text("status").notNull(),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  paidOutAt: timestamp("paid_out_at"),
  rejectionReason: text("rejection_reason"),
  paymentReference: text("payment_reference"),
});

export const promoCodes = pgTable("promo_codes", {
  id: text("id").primaryKey(),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id),
  code: text("code").notNull(),
  type: text("type").notNull(), // Percentage or FixedAmount
  discountValue: decimal("discount_value", {
    precision: 10,
    scale: 2,
  }).notNull(),
  maxUsage: integer("max_usage").notNull(),
  usedCount: integer("used_count").notNull().default(0),
  validStart: timestamp("valid_start").notNull(),
  validEnd: timestamp("valid_end").notNull(),
  minPurchaseAmount: decimal("min_purchase_amount", {
    precision: 10,
    scale: 2,
  }),
  currency: text("currency").notNull().default("IDR"),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const waitlist = pgTable("waitlist", {
  id: text("id").primaryKey(),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  ticketCategoryId: text("ticket_category_id").references(
    () => ticketCategories.id,
  ),
  quantity: integer("quantity").notNull().default(1),
  status: text("status").notNull(), // Waiting, Notified, Converted, Cancelled
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
  notifiedAt: timestamp("notified_at"),
});
