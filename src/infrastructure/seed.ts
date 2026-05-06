import { db } from "@/infrastructure/database/connection";
import {
  events,
  ticketCategories,
  bookings,
  bookingItems,
  tickets,
  refunds,
} from "@/infrastructure/database/schema";
import { createId } from "@/shared/id";
import { nanoid } from "nanoid";

/**
 * Comprehensive seed script for the Event Ticketing & Booking System.
 * Seeds data across all tables so EVERY endpoint and parameter can be tested.
 *
 * Deterministic IDs are used so you can immediately test with known values.
 */

// ──── Deterministic IDs ────────────────────────────────────────────────────

// Events
const EVENT_DRAFT_ID = "event_draft-001";
const EVENT_PUBLISHED_ID = "event_published-001";
const EVENT_PUBLISHED_2_ID = "event_published-002";
const EVENT_CANCELLED_ID = "event_cancelled-001";
const EVENT_COMPLETED_ID = "event_completed-001";

// Ticket categories - published event 1
const CAT_REGULAR_ID = "cat_regular-001";
const CAT_VIP_ID = "cat_vip-001";
const CAT_EARLY_BIRD_ID = "cat_earlybird-001";

// Ticket categories - published event 2
const CAT_REGULAR_2_ID = "cat_regular-002";
const CAT_VIP_2_ID = "cat_vip-002";

// Ticket categories - draft event
const CAT_DRAFT_REGULAR_ID = "cat_draft-regular-001";

// Ticket categories - cancelled event
const CAT_CANCELLED_REGULAR_ID = "cat_cancelled-regular-001";

// Ticket categories - completed event
const CAT_COMPLETED_REGULAR_ID = "cat_completed-regular-001";

// Bookings
const BOOKING_PENDING_ID = "booking_pending-001";
const BOOKING_PAID_ID = "booking_paid-001";
const BOOKING_PAID_2_ID = "booking_paid-002";
const BOOKING_EXPIRED_ID = "booking_expired-001";
const BOOKING_REFUNDED_ID = "booking_refunded-001";
const BOOKING_PAID_CHECKEDIN_ID = "booking_paid-checkedin-001";

// Booking items
const BI_PENDING_1 = "bi_pending-001";
const BI_PAID_1 = "bi_paid-001";
const BI_PAID_2 = "bi_paid-002";
const BI_EXPIRED_1 = "bi_expired-001";
const BI_REFUNDED_1 = "bi_refunded-001";
const BI_PAID_CHECKEDIN_1 = "bi_paid-checkedin-001";

// Tickets
const TICKET_ACTIVE_1 = "ticket_active-001";
const TICKET_ACTIVE_2 = "ticket_active-002";
const TICKET_ACTIVE_3 = "ticket_active-003";
const TICKET_CHECKED_IN_1 = "ticket_checkedin-001";
const TICKET_CANCELLED_1 = "ticket_cancelled-001";
const TICKET_CANCELLED_2 = "ticket_cancelled-002";

// Ticket codes (deterministic)
const TCODE_ACTIVE_1 = "TCKT-ACTV-0001";
const TCODE_ACTIVE_2 = "TCKT-ACTV-0002";
const TCODE_ACTIVE_3 = "TCKT-ACTV-0003";
const TCODE_CHECKED_IN_1 = "TCKT-CHKD-0001";
const TCODE_CANCELLED_1 = "TCKT-CANC-0001";
const TCODE_CANCELLED_2 = "TCKT-CANC-0002";

// Refunds
const REFUND_REQUESTED_ID = "refund_requested-001";
const REFUND_APPROVED_ID = "refund_approved-001";
const REFUND_REJECTED_ID = "refund_rejected-001";
const REFUND_PAID_OUT_ID = "refund_paidout-001";

// ──── Date helpers ─────────────────────────────────────────────────────────

const now = new Date();
const daysFromNow = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000);
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
const minutesFromNow = (m: number) => new Date(now.getTime() + m * 60 * 1000);

export async function seed() {
  console.log("[seed] Seeding database...\n");

  // ── 1. Clean existing data (order matters for FK constraints) ───────────
  console.log("  [clean] Cleaning existing data...");
  await db.delete(refunds);
  await db.delete(tickets);
  await db.delete(bookingItems);
  await db.delete(bookings);
  await db.delete(ticketCategories);
  await db.delete(events);

  // ── 2. Seed Events ─────────────────────────────────────────────────────
  console.log("  [events] Seeding events...");

  const seedEvents = [
    {
      id: EVENT_DRAFT_ID,
      name: "Surabaya AI Workshop 2026",
      description: "Workshop kecerdasan buatan untuk pemula hingga menengah, dengan hands-on project.",
      venue: "ITS Surabaya, Gedung Robotika",
      startAt: daysFromNow(45),
      endAt: daysFromNow(45.5),
      maxCapacity: 200,
      status: "Draft",
      createdAt: daysAgo(5),
    },
    {
      id: EVENT_PUBLISHED_ID,
      name: "Jakarta Tech Summit 2026",
      description: "Conference teknologi terbesar di Indonesia. Workshop, expo, dan networking session.",
      venue: "Jakarta Convention Center",
      startAt: daysFromNow(30),
      endAt: daysFromNow(30.5),
      maxCapacity: 1000,
      status: "Published",
      createdAt: daysAgo(10),
    },
    {
      id: EVENT_PUBLISHED_2_ID,
      name: "Bandung Creative Fest 2026",
      description: "Festival kreatif dengan tema desain, musik, dan teknologi digital.",
      venue: "Sasana Budaya Ganesha, Bandung",
      startAt: daysFromNow(60),
      endAt: daysFromNow(60.5),
      maxCapacity: 500,
      status: "Published",
      createdAt: daysAgo(7),
    },
    {
      id: EVENT_CANCELLED_ID,
      name: "Malang Startup Night (Cancelled)",
      description: "Networking malam untuk startup founder di Malang. Event ini sudah dibatalkan.",
      venue: "Hotel Tugu Malang",
      startAt: daysFromNow(15),
      endAt: daysFromNow(15.3),
      maxCapacity: 150,
      status: "Cancelled",
      createdAt: daysAgo(20),
    },
    {
      id: EVENT_COMPLETED_ID,
      name: "Yogya DevOps Day 2025",
      description: "Konferensi DevOps yang sudah selesai. Data historis.",
      venue: "Ambarrukmo Royal, Yogyakarta",
      startAt: daysAgo(30),
      endAt: daysAgo(29.5),
      maxCapacity: 300,
      status: "Completed",
      createdAt: daysAgo(60),
    },
  ];

  for (const e of seedEvents) {
    await db.insert(events).values(e);
  }

  // ── 3. Seed Ticket Categories ──────────────────────────────────────────
  console.log("  [categories] Seeding ticket categories...");

  const seedCategories = [
    // Draft event -- has 1 active category (for publish test)
    {
      id: CAT_DRAFT_REGULAR_ID,
      eventId: EVENT_DRAFT_ID,
      name: "Regular",
      price: "150000.00",
      currency: "IDR",
      quota: 200,
      bookedQuantity: 0,
      salesStart: daysFromNow(5),
      salesEnd: daysFromNow(44),
      isActive: true,
    },
    // Published event 1 -- 3 categories
    {
      id: CAT_REGULAR_ID,
      eventId: EVENT_PUBLISHED_ID,
      name: "Regular",
      price: "250000.00",
      currency: "IDR",
      quota: 700,
      bookedQuantity: 8, // some already booked
      salesStart: daysAgo(5),
      salesEnd: daysFromNow(29),
      isActive: true,
    },
    {
      id: CAT_VIP_ID,
      eventId: EVENT_PUBLISHED_ID,
      name: "VIP",
      price: "750000.00",
      currency: "IDR",
      quota: 200,
      bookedQuantity: 3,
      salesStart: daysAgo(5),
      salesEnd: daysFromNow(29),
      isActive: true,
    },
    {
      id: CAT_EARLY_BIRD_ID,
      eventId: EVENT_PUBLISHED_ID,
      name: "Early Bird",
      price: "175000.00",
      currency: "IDR",
      quota: 100,
      bookedQuantity: 100,
      salesStart: daysAgo(10),
      salesEnd: daysAgo(3), // sales ended
      isActive: true,
    },
    // Published event 2 -- 2 categories
    {
      id: CAT_REGULAR_2_ID,
      eventId: EVENT_PUBLISHED_2_ID,
      name: "Regular",
      price: "200000.00",
      currency: "IDR",
      quota: 400,
      bookedQuantity: 0,
      salesStart: daysAgo(2),
      salesEnd: daysFromNow(59),
      isActive: true,
    },
    {
      id: CAT_VIP_2_ID,
      eventId: EVENT_PUBLISHED_2_ID,
      name: "VIP",
      price: "500000.00",
      currency: "IDR",
      quota: 100,
      bookedQuantity: 0,
      salesStart: daysAgo(2),
      salesEnd: daysFromNow(59),
      isActive: true,
    },
    // Cancelled event
    {
      id: CAT_CANCELLED_REGULAR_ID,
      eventId: EVENT_CANCELLED_ID,
      name: "Regular",
      price: "100000.00",
      currency: "IDR",
      quota: 150,
      bookedQuantity: 5,
      salesStart: daysAgo(15),
      salesEnd: daysFromNow(14),
      isActive: false,
    },
    // Completed event
    {
      id: CAT_COMPLETED_REGULAR_ID,
      eventId: EVENT_COMPLETED_ID,
      name: "Regular",
      price: "300000.00",
      currency: "IDR",
      quota: 300,
      bookedQuantity: 250,
      salesStart: daysAgo(90),
      salesEnd: daysAgo(31),
      isActive: true,
    },
  ];

  for (const cat of seedCategories) {
    await db.insert(ticketCategories).values(cat);
  }

  // ── 4. Seed Bookings ───────────────────────────────────────────────────
  console.log("  [bookings] Seeding bookings...");

  const seedBookings = [
    // PendingPayment booking -- for testing pay endpoint
    {
      id: BOOKING_PENDING_ID,
      eventId: EVENT_PUBLISHED_ID,
      customerName: "Andi Pratama",
      customerEmail: "andi@example.com",
      totalAmount: "500000.00", // 2 x Regular (250000)
      currency: "IDR",
      status: "PendingPayment",
      paymentDeadline: minutesFromNow(15), // still valid
      createdAt: now,
      paidAt: null,
    },
    // Paid booking -- for testing refund request, view tickets, get participants
    {
      id: BOOKING_PAID_ID,
      eventId: EVENT_PUBLISHED_ID,
      customerName: "Budi Santoso",
      customerEmail: "budi@example.com",
      totalAmount: "750000.00", // 1 x VIP (750000)
      currency: "IDR",
      status: "Paid",
      paymentDeadline: daysAgo(1),
      createdAt: daysAgo(2),
      paidAt: daysAgo(2),
    },
    // Paid booking 2 -- for testing check-in (has a checked-in ticket)
    {
      id: BOOKING_PAID_CHECKEDIN_ID,
      eventId: EVENT_PUBLISHED_ID,
      customerName: "Dewi Lestari",
      customerEmail: "dewi@example.com",
      totalAmount: "500000.00", // 2 x Regular
      currency: "IDR",
      status: "Paid",
      paymentDeadline: daysAgo(3),
      createdAt: daysAgo(4),
      paidAt: daysAgo(4),
    },
    // Expired booking -- for testing expired status
    {
      id: BOOKING_EXPIRED_ID,
      eventId: EVENT_PUBLISHED_ID,
      customerName: "Eka Saputra",
      customerEmail: "eka@example.com",
      totalAmount: "250000.00",
      currency: "IDR",
      status: "Expired",
      paymentDeadline: daysAgo(5),
      createdAt: daysAgo(6),
      paidAt: null,
    },
    // Refunded booking -- for testing refund flow completion
    {
      id: BOOKING_REFUNDED_ID,
      eventId: EVENT_PUBLISHED_ID,
      customerName: "Fajar Hidayat",
      customerEmail: "fajar@example.com",
      totalAmount: "250000.00",
      currency: "IDR",
      status: "Refunded",
      paymentDeadline: daysAgo(7),
      createdAt: daysAgo(8),
      paidAt: daysAgo(8),
    },
    // Paid booking on published event 2 -- for request refund test
    {
      id: BOOKING_PAID_2_ID,
      eventId: EVENT_PUBLISHED_2_ID,
      customerName: "Gita Nirmala",
      customerEmail: "gita@example.com",
      totalAmount: "400000.00", // 2 x Regular (200000)
      currency: "IDR",
      status: "Paid",
      paymentDeadline: daysAgo(1),
      createdAt: daysAgo(1),
      paidAt: daysAgo(1),
    },
  ];

  for (const b of seedBookings) {
    await db.insert(bookings).values(b);
  }

  // ── 5. Seed Booking Items ──────────────────────────────────────────────
  console.log("  [items] Seeding booking items...");

  const seedBookingItems = [
    {
      id: BI_PENDING_1,
      bookingId: BOOKING_PENDING_ID,
      ticketCategoryId: CAT_REGULAR_ID,
      quantity: 2,
      unitPrice: "250000.00",
      currency: "IDR",
    },
    {
      id: BI_PAID_1,
      bookingId: BOOKING_PAID_ID,
      ticketCategoryId: CAT_VIP_ID,
      quantity: 1,
      unitPrice: "750000.00",
      currency: "IDR",
    },
    {
      id: BI_PAID_CHECKEDIN_1,
      bookingId: BOOKING_PAID_CHECKEDIN_ID,
      ticketCategoryId: CAT_REGULAR_ID,
      quantity: 2,
      unitPrice: "250000.00",
      currency: "IDR",
    },
    {
      id: BI_EXPIRED_1,
      bookingId: BOOKING_EXPIRED_ID,
      ticketCategoryId: CAT_REGULAR_ID,
      quantity: 1,
      unitPrice: "250000.00",
      currency: "IDR",
    },
    {
      id: BI_REFUNDED_1,
      bookingId: BOOKING_REFUNDED_ID,
      ticketCategoryId: CAT_REGULAR_ID,
      quantity: 1,
      unitPrice: "250000.00",
      currency: "IDR",
    },
    {
      id: BI_PAID_2,
      bookingId: BOOKING_PAID_2_ID,
      ticketCategoryId: CAT_REGULAR_2_ID,
      quantity: 2,
      unitPrice: "200000.00",
      currency: "IDR",
    },
  ];

  for (const bi of seedBookingItems) {
    await db.insert(bookingItems).values(bi);
  }

  // ── 6. Seed Tickets ────────────────────────────────────────────────────
  console.log("  [tickets] Seeding tickets...");

  const seedTickets = [
    // Active ticket from Budi's paid booking (VIP)
    {
      id: TICKET_ACTIVE_1,
      bookingId: BOOKING_PAID_ID,
      eventId: EVENT_PUBLISHED_ID,
      ticketCategoryId: CAT_VIP_ID,
      ticketCode: TCODE_ACTIVE_1,
      customerName: "Budi Santoso",
      status: "Active",
      issuedAt: daysAgo(2),
      checkedInAt: null,
    },
    // Active ticket from Dewi's booking (Regular)
    {
      id: TICKET_ACTIVE_2,
      bookingId: BOOKING_PAID_CHECKEDIN_ID,
      eventId: EVENT_PUBLISHED_ID,
      ticketCategoryId: CAT_REGULAR_ID,
      ticketCode: TCODE_ACTIVE_2,
      customerName: "Dewi Lestari",
      status: "Active",
      issuedAt: daysAgo(4),
      checkedInAt: null,
    },
    // Checked-in ticket from Dewi's booking (Regular) -- already used
    {
      id: TICKET_CHECKED_IN_1,
      bookingId: BOOKING_PAID_CHECKEDIN_ID,
      eventId: EVENT_PUBLISHED_ID,
      ticketCategoryId: CAT_REGULAR_ID,
      ticketCode: TCODE_CHECKED_IN_1,
      customerName: "Dewi Lestari",
      status: "CheckedIn",
      issuedAt: daysAgo(4),
      checkedInAt: daysAgo(1),
    },
    // Cancelled ticket from refunded booking
    {
      id: TICKET_CANCELLED_1,
      bookingId: BOOKING_REFUNDED_ID,
      eventId: EVENT_PUBLISHED_ID,
      ticketCategoryId: CAT_REGULAR_ID,
      ticketCode: TCODE_CANCELLED_1,
      customerName: "Fajar Hidayat",
      status: "Cancelled",
      issuedAt: daysAgo(8),
      checkedInAt: null,
    },
    // Active tickets from Gita's paid booking on event 2
    {
      id: TICKET_ACTIVE_3,
      bookingId: BOOKING_PAID_2_ID,
      eventId: EVENT_PUBLISHED_2_ID,
      ticketCategoryId: CAT_REGULAR_2_ID,
      ticketCode: TCODE_ACTIVE_3,
      customerName: "Gita Nirmala",
      status: "Active",
      issuedAt: daysAgo(1),
      checkedInAt: null,
    },
    {
      id: TICKET_CANCELLED_2,
      bookingId: BOOKING_PAID_2_ID,
      eventId: EVENT_PUBLISHED_2_ID,
      ticketCategoryId: CAT_REGULAR_2_ID,
      ticketCode: TCODE_CANCELLED_2,
      customerName: "Gita Nirmala",
      status: "Active",
      issuedAt: daysAgo(1),
      checkedInAt: null,
    },
  ];

  for (const t of seedTickets) {
    await db.insert(tickets).values(t);
  }

  // ── 7. Seed Refunds ────────────────────────────────────────────────────
  console.log("  [refunds] Seeding refunds...");

  const seedRefunds = [
    // Requested refund -- for testing approve/reject
    {
      id: REFUND_REQUESTED_ID,
      bookingId: BOOKING_PAID_2_ID,
      amount: "400000.00",
      currency: "IDR",
      status: "Requested",
      requestedAt: now,
      approvedAt: null,
      rejectedAt: null,
      paidOutAt: null,
      rejectionReason: null,
      paymentReference: null,
    },
    // Approved refund -- for testing payout
    {
      id: REFUND_APPROVED_ID,
      bookingId: BOOKING_REFUNDED_ID,
      amount: "250000.00",
      currency: "IDR",
      status: "Approved",
      requestedAt: daysAgo(3),
      approvedAt: daysAgo(2),
      rejectedAt: null,
      paidOutAt: null,
      rejectionReason: null,
      paymentReference: null,
    },
    // Rejected refund -- historical data
    {
      id: REFUND_REJECTED_ID,
      bookingId: BOOKING_PAID_ID,
      amount: "750000.00",
      currency: "IDR",
      status: "Rejected",
      requestedAt: daysAgo(5),
      approvedAt: null,
      rejectedAt: daysAgo(4),
      paidOutAt: null,
      rejectionReason: "Permintaan refund tidak memenuhi syarat, event masih aktif.",
      paymentReference: null,
    },
    // Paid out refund -- historical data
    {
      id: REFUND_PAID_OUT_ID,
      bookingId: BOOKING_REFUNDED_ID,
      amount: "250000.00",
      currency: "IDR",
      status: "PaidOut",
      requestedAt: daysAgo(10),
      approvedAt: daysAgo(9),
      rejectedAt: null,
      paidOutAt: daysAgo(8),
      rejectionReason: null,
      paymentReference: "REF-PAY-20260420-001",
    },
  ];

  for (const r of seedRefunds) {
    await db.insert(refunds).values(r);
  }

  // ── Done ───────────────────────────────────────────────────────────────
  console.log("\n[done] Seed completed successfully!\n");
  printTestingGuide();
}

function printTestingGuide() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  TESTING GUIDE -- All endpoints & params                     ");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");
  console.log("──── EVENTS ────────────────────────────────────────────────");
  console.log(`  GET  /api/v1/events                       -> List published events`);
  console.log(`  GET  /api/v1/events?status=Draft           -> List draft events`);
  console.log(`  GET  /api/v1/events?location=Jakarta       -> Filter by location`);
  console.log(`  GET  /api/v1/events/${EVENT_PUBLISHED_ID}  -> Get event detail`);
  console.log(`  POST /api/v1/events                        -> Create event`);
  console.log(`  POST /api/v1/events/${EVENT_DRAFT_ID}/publish -> Publish draft event`);
  console.log(`  POST /api/v1/events/${EVENT_PUBLISHED_ID}/cancel -> Cancel event`);
  console.log(`  GET  /api/v1/events/${EVENT_PUBLISHED_ID}/sales-report`);
  console.log(`  GET  /api/v1/events/${EVENT_PUBLISHED_ID}/participants`);
  console.log("");
  console.log("──── BOOKINGS ──────────────────────────────────────────────");
  console.log(`  POST /api/v1/bookings                       -> Create booking`);
  console.log(`    Body: { eventId: "${EVENT_PUBLISHED_ID}",`);
  console.log(`            customerName: "Test User",`);
  console.log(`            customerEmail: "test@example.com",`);
  console.log(`            items: [{ ticketCategoryId: "${CAT_REGULAR_ID}", quantity: 1 }] }`);
  console.log(`  GET  /api/v1/bookings/${BOOKING_PENDING_ID} -> Get pending booking`);
  console.log(`  GET  /api/v1/bookings/${BOOKING_PAID_ID}    -> Get paid booking`);
  console.log(`  POST /api/v1/bookings/${BOOKING_PENDING_ID}/pay -> Pay booking`);
  console.log(`    Body: { amount: 500000 }`);
  console.log("");
  console.log("──── TICKETS ───────────────────────────────────────────────");
  console.log(`  POST /api/v1/tickets/check-in -> Check in ticket`);
  console.log(`    Body: { ticketCode: "${TCODE_ACTIVE_1}", eventId: "${EVENT_PUBLISHED_ID}" }`);
  console.log(`    (already checked in: "${TCODE_CHECKED_IN_1}")`);
  console.log("");
  console.log("──── REFUNDS ───────────────────────────────────────────────");
  console.log(`  POST /api/v1/refunds`);
  console.log(`    Body: { bookingId: "${BOOKING_PAID_ID}" } -> Request refund`);
  console.log(`  POST /api/v1/refunds/${REFUND_REQUESTED_ID}/approve -> Approve`);
  console.log(`  POST /api/v1/refunds/${REFUND_REQUESTED_ID}/reject`);
  console.log(`    Body: { reason: "Not eligible" } -> Reject`);
  console.log(`  POST /api/v1/refunds/${REFUND_APPROVED_ID}/payout -> Payout`);
  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
}

// Run if called directly: bun run src/infrastructure/seed.ts
seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[error] Seed failed:", err);
    process.exit(1);
  });
