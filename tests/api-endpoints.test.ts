import { describe, expect, test, beforeAll } from "bun:test";
import { createApp } from "@/presentation/http/create-app";

describe("API Endpoints Integration Tests", () => {
  let app: Awaited<ReturnType<typeof createApp>>;

  beforeAll(async () => {
    app = await createApp();
  });

  // Helper function to make requests
  const request = (method: string, path: string, body?: any) => {
    return app.handle(
      new Request(`http://localhost${path}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
    );
  };

  // Helper to create test event with category
  const createTestEvent = async (name: string) => {
    const createEvent = await request("POST", "/api/v1/events", {
      name,
      venue: "Test Venue",
      startAt: "2027-12-01T09:00:00Z",
      endAt: "2027-12-01T18:00:00Z",
      maxCapacity: 1000,
    });
    const eventData = await createEvent.json();
    const eventId = eventData.data.id;

    const createCategory = await request("POST", `/api/v1/events/${eventId}/ticket-categories`, {
      name: "Test Regular",
      price: 250000,
      quota: 500,
      salesStart: "2026-05-01T00:00:00Z", // Start from May 1, 2026 (current date is May 6, 2026)
      salesEnd: "2027-11-30T23:59:59Z",
    });
    const categoryData = await createCategory.json();
    const categoryId = categoryData.data.id;

    await request("POST", `/api/v1/events/${eventId}/publish`);

    return { eventId, categoryId };
  };

  describe("Events Endpoints", () => {
    test("GET /api/v1/events - List all published events", async () => {
      const response = await request("GET", "/api/v1/events");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
    });

    test("GET /api/v1/events?status=Draft - Filter events by status", async () => {
      const response = await request("GET", "/api/v1/events?status=Draft");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    test("GET /api/v1/events/:id - Get event details", async () => {
      const response = await request("GET", "/api/v1/events/event_published-001");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe("event_published-001");
      expect(data.data.name).toBeDefined();
      expect(Array.isArray(data.data.ticketCategories)).toBe(true);
    });

    test("GET /api/v1/events/:id - Non-existent event returns 404", async () => {
      const response = await request("GET", "/api/v1/events/non-existent");

      expect(response.status).toBe(404);
    });

    test("POST /api/v1/events - Create new event", async () => {
      const response = await request("POST", "/api/v1/events", {
        name: "Test Event Integration",
        description: "Test event created from integration test",
        venue: "Test Venue",
        startAt: "2026-12-01T09:00:00Z",
        endAt: "2026-12-01T18:00:00Z",
        maxCapacity: 100,
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBeDefined();
    });

    test("POST /api/v1/events/:id/ticket-categories - Add ticket category", async () => {
      // First create an event
      const createEvent = await request("POST", "/api/v1/events", {
        name: "Event for Category Test",
        venue: "Test Venue",
        startAt: "2026-12-01T09:00:00Z",
        endAt: "2026-12-01T18:00:00Z",
        maxCapacity: 100,
      });
      const eventData = await createEvent.json();
      const eventId = eventData.data.id;

      // Add ticket category
      const response = await request("POST", `/api/v1/events/${eventId}/ticket-categories`, {
        name: "Test Category",
        price: 150000,
        quota: 50,
        salesStart: "2026-10-01T00:00:00Z",
        salesEnd: "2026-11-30T23:59:59Z",
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBeDefined();
    });

    test("POST /api/v1/events/:id/publish - Publish draft event", async () => {
      // Create event with ticket category
      const createEvent = await request("POST", "/api/v1/events", {
        name: "Event to Publish",
        venue: "Test Venue",
        startAt: "2026-12-01T09:00:00Z",
        endAt: "2026-12-01T18:00:00Z",
        maxCapacity: 100,
      });
      const eventData = await createEvent.json();
      const eventId = eventData.data.id;

      // Add ticket category
      await request("POST", `/api/v1/events/${eventId}/ticket-categories`, {
        name: "Regular",
        price: 100000,
        quota: 50,
        salesStart: "2026-10-01T00:00:00Z",
        salesEnd: "2026-11-30T23:59:59Z",
      });

      // Publish
      const response = await request("POST", `/api/v1/events/${eventId}/publish`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    test("POST /api/v1/events/:id/cancel - Cancel published event", async () => {
      // Create, add category, and publish event
      const createEvent = await request("POST", "/api/v1/events", {
        name: "Event to Cancel",
        venue: "Test Venue",
        startAt: "2026-12-01T09:00:00Z",
        endAt: "2026-12-01T18:00:00Z",
        maxCapacity: 100,
      });
      const eventData = await createEvent.json();
      const eventId = eventData.data.id;

      await request("POST", `/api/v1/events/${eventId}/ticket-categories`, {
        name: "Regular",
        price: 100000,
        quota: 50,
        salesStart: "2026-10-01T00:00:00Z",
        salesEnd: "2026-11-30T23:59:59Z",
      });

      await request("POST", `/api/v1/events/${eventId}/publish`);

      // Cancel
      const response = await request("POST", `/api/v1/events/${eventId}/cancel`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    test("POST /api/v1/events/:id/ticket-categories/:categoryId/disable - Disable ticket category", async () => {
      // Create event with category
      const createEvent = await request("POST", "/api/v1/events", {
        name: "Event for Disable Category",
        venue: "Test Venue",
        startAt: "2026-12-01T09:00:00Z",
        endAt: "2026-12-01T18:00:00Z",
        maxCapacity: 100,
      });
      const eventData = await createEvent.json();
      const eventId = eventData.data.id;

      const createCategory = await request("POST", `/api/v1/events/${eventId}/ticket-categories`, {
        name: "Category to Disable",
        price: 100000,
        quota: 50,
        salesStart: "2026-10-01T00:00:00Z",
        salesEnd: "2026-11-30T23:59:59Z",
      });
      const categoryData = await createCategory.json();
      const categoryId = categoryData.data.id;

      // Disable
      const response = await request("POST", `/api/v1/events/${eventId}/ticket-categories/${categoryId}/disable`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    test("GET /api/v1/events/:id/sales-report - Get sales report", async () => {
      const response = await request("GET", "/api/v1/events/event_published-001/sales-report");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.eventId).toBe("event_published-001");
      expect(data.data.categorySales).toBeDefined();
      expect(data.data.bookingStats).toBeDefined();
      expect(data.data.totalRevenue).toBeDefined();
    });

    test("GET /api/v1/events/:id/participants - Get event participants", async () => {
      const response = await request("GET", "/api/v1/events/event_published-001/participants");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  describe("Bookings Endpoints", () => {
    test("POST /api/v1/bookings - Create new booking", async () => {
      const { eventId, categoryId } = await createTestEvent("Test Event for Booking");

      const response = await request("POST", "/api/v1/bookings", {
        eventId,
        customerName: "Test Customer",
        customerEmail: `test-${Date.now()}@example.com`,
        items: [{ ticketCategoryId: categoryId, quantity: 2 }],
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBeDefined();
    });

    test("POST /api/v1/bookings - Cannot create duplicate booking for same customer", async () => {
      const { eventId, categoryId } = await createTestEvent("Test Event for Duplicate");
      const email = `duplicate-${Date.now()}@example.com`;

      // First booking
      await request("POST", "/api/v1/bookings", {
        eventId,
        customerName: "Duplicate Test",
        customerEmail: email,
        items: [{ ticketCategoryId: categoryId, quantity: 1 }],
      });

      // Try duplicate booking
      const response = await request("POST", "/api/v1/bookings", {
        eventId,
        customerName: "Duplicate Test",
        customerEmail: email,
        items: [{ ticketCategoryId: categoryId, quantity: 1 }],
      });

      expect(response.status).toBe(409); // Conflict
    });

    test("GET /api/v1/bookings/:id - Get booking details", async () => {
      const response = await request("GET", "/api/v1/bookings/booking_paid-001");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe("booking_paid-001");
      expect(data.data.status).toBe("Paid");
      expect(data.data.totalAmount).toBeDefined();
      expect(Array.isArray(data.data.items)).toBe(true);
    });

    test("POST /api/v1/bookings/:id/pay - Pay for booking", async () => {
      const { eventId, categoryId } = await createTestEvent("Test Event for Pay");

      // Create new booking
      const createBooking = await request("POST", "/api/v1/bookings", {
        eventId,
        customerName: "Pay Test",
        customerEmail: `pay-${Date.now()}@example.com`,
        items: [{ ticketCategoryId: categoryId, quantity: 1 }],
      });
      const bookingData = await createBooking.json();
      const bookingId = bookingData.data.id;

      // Get booking to know the amount
      const getBooking = await request("GET", `/api/v1/bookings/${bookingId}`);
      const booking = await getBooking.json();
      const amount = booking.data.totalAmount;

      // Pay
      const response = await request("POST", `/api/v1/bookings/${bookingId}/pay`, {
        amount,
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    test("POST /api/v1/bookings/:id/pay - Cannot pay with wrong amount", async () => {
      const { eventId, categoryId } = await createTestEvent("Test Event for Wrong Amount");

      // Create new booking
      const createBooking = await request("POST", "/api/v1/bookings", {
        eventId,
        customerName: "Wrong Amount Test",
        customerEmail: `wrongamount-${Date.now()}@example.com`,
        items: [{ ticketCategoryId: categoryId, quantity: 1 }],
      });
      const bookingData = await createBooking.json();
      const bookingId = bookingData.data.id;

      // Try to pay with wrong amount
      const response = await request("POST", `/api/v1/bookings/${bookingId}/pay`, {
        amount: 1000, // Wrong amount
      });

      expect(response.status).toBe(400);
    });

    test("POST /api/v1/bookings/:id/expire - Expire booking", async () => {
      const { eventId, categoryId } = await createTestEvent("Test Event for Expire");

      // Create new booking
      const createBooking = await request("POST", "/api/v1/bookings", {
        eventId,
        customerName: "Expire Test",
        customerEmail: `expire-${Date.now()}@example.com`,
        items: [{ ticketCategoryId: categoryId, quantity: 1 }],
      });
      const bookingData = await createBooking.json();
      const bookingId = bookingData.data.id;

      // Expire
      const response = await request("POST", `/api/v1/bookings/${bookingId}/expire`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    test("GET /api/v1/bookings/:id/tickets - Get booking tickets", async () => {
      const response = await request("GET", "/api/v1/bookings/booking_paid-001/tickets");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
      expect(data.data[0].ticketCode).toBeDefined();
    });
  });

  describe("Tickets Endpoints", () => {
    test("POST /api/v1/tickets/check-in - Check in valid ticket", async () => {
      const response = await request("POST", "/api/v1/tickets/check-in", {
        ticketCode: "TCKT-ACTV-0002",
        eventId: "event_published-001",
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    test("POST /api/v1/tickets/check-in - Cannot check in already checked-in ticket", async () => {
      const response = await request("POST", "/api/v1/tickets/check-in", {
        ticketCode: "TCKT-CHKD-0001",
        eventId: "event_published-001",
      });

      expect(response.status).toBe(400);
    });

    test("POST /api/v1/tickets/check-in - Invalid ticket code returns error", async () => {
      const response = await request("POST", "/api/v1/tickets/check-in", {
        ticketCode: "INVALID-CODE",
        eventId: "event_published-001",
      });

      expect(response.status).toBe(404);
    });
  });

  describe("Refunds Endpoints", () => {
    test("POST /api/v1/refunds - Request refund for paid booking", async () => {
      const { eventId, categoryId } = await createTestEvent("Test Event for Refund");

      // Create and pay booking
      const createBooking = await request("POST", "/api/v1/bookings", {
        eventId,
        customerName: "Refund Test",
        customerEmail: `refund-${Date.now()}@example.com`,
        items: [{ ticketCategoryId: categoryId, quantity: 1 }],
      });
      const bookingData = await createBooking.json();
      const bookingId = bookingData.data.id;

      // Pay
      const getBooking = await request("GET", `/api/v1/bookings/${bookingId}`);
      const booking = await getBooking.json();
      await request("POST", `/api/v1/bookings/${bookingId}/pay`, {
        amount: booking.data.totalAmount,
      });

      // Request refund
      const response = await request("POST", "/api/v1/refunds", {
        bookingId,
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBeDefined();
    });

    test("POST /api/v1/refunds - Cannot request refund for unpaid booking", async () => {
      const { eventId, categoryId } = await createTestEvent("Test Event for Unpaid Refund");

      // Create new booking (will be pending)
      const createBooking = await request("POST", "/api/v1/bookings", {
        eventId,
        customerName: "Refund Test Unpaid",
        customerEmail: `refundunpaid-${Date.now()}@example.com`,
        items: [{ ticketCategoryId: categoryId, quantity: 1 }],
      });
      const bookingData = await createBooking.json();
      const bookingId = bookingData.data.id;

      // Try to request refund
      const response = await request("POST", "/api/v1/refunds", {
        bookingId,
      });

      expect(response.status).toBe(400);
    });

    test("POST /api/v1/refunds/:id/approve - Approve refund request", async () => {
      const { eventId, categoryId } = await createTestEvent("Test Event for Approve Refund");

      // Create, pay, and request refund
      const createBooking = await request("POST", "/api/v1/bookings", {
        eventId,
        customerName: "Refund Approve Test",
        customerEmail: `refundapprove-${Date.now()}@example.com`,
        items: [{ ticketCategoryId: categoryId, quantity: 1 }],
      });
      const bookingData = await createBooking.json();
      const bookingId = bookingData.data.id;

      // Get amount and pay
      const getBooking = await request("GET", `/api/v1/bookings/${bookingId}`);
      const booking = await getBooking.json();
      await request("POST", `/api/v1/bookings/${bookingId}/pay`, {
        amount: booking.data.totalAmount,
      });

      // Request refund
      const refundRes = await request("POST", "/api/v1/refunds", {
        bookingId,
      });
      const refundData = await refundRes.json();
      const refundId = refundData.data.id;

      // Approve
      const response = await request("POST", `/api/v1/refunds/${refundId}/approve`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    test("POST /api/v1/refunds/:id/reject - Reject refund request", async () => {
      const { eventId, categoryId } = await createTestEvent("Test Event for Reject Refund");

      // Create, pay, and request refund
      const createBooking = await request("POST", "/api/v1/bookings", {
        eventId,
        customerName: "Refund Reject Test",
        customerEmail: `refundreject-${Date.now()}@example.com`,
        items: [{ ticketCategoryId: categoryId, quantity: 1 }],
      });
      const bookingData = await createBooking.json();
      const bookingId = bookingData.data.id;

      // Get amount and pay
      const getBooking = await request("GET", `/api/v1/bookings/${bookingId}`);
      const booking = await getBooking.json();
      await request("POST", `/api/v1/bookings/${bookingId}/pay`, {
        amount: booking.data.totalAmount,
      });

      // Request refund
      const refundRes = await request("POST", "/api/v1/refunds", {
        bookingId,
      });
      const refundData = await refundRes.json();
      const refundId = refundData.data.id;

      // Reject
      const response = await request("POST", `/api/v1/refunds/${refundId}/reject`, {
        reason: "Test rejection reason",
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    test("POST /api/v1/refunds/:id/payout - Payout approved refund", async () => {
      const { eventId, categoryId } = await createTestEvent("Test Event for Payout Refund");

      // Create, pay, request, and approve refund
      const createBooking = await request("POST", "/api/v1/bookings", {
        eventId,
        customerName: "Refund Payout Test",
        customerEmail: `refundpayout-${Date.now()}@example.com`,
        items: [{ ticketCategoryId: categoryId, quantity: 1 }],
      });
      const bookingData = await createBooking.json();
      const bookingId = bookingData.data.id;

      // Get amount and pay
      const getBooking = await request("GET", `/api/v1/bookings/${bookingId}`);
      const booking = await getBooking.json();
      await request("POST", `/api/v1/bookings/${bookingId}/pay`, {
        amount: booking.data.totalAmount,
      });

      // Request refund
      const refundRes = await request("POST", "/api/v1/refunds", {
        bookingId,
      });
      const refundData = await refundRes.json();
      const refundId = refundData.data.id;

      // Approve
      await request("POST", `/api/v1/refunds/${refundId}/approve`);

      // Payout
      const response = await request("POST", `/api/v1/refunds/${refundId}/payout`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    test("POST /api/v1/refunds/:id/payout - Cannot payout non-approved refund", async () => {
      const { eventId, categoryId } = await createTestEvent("Test Event for Payout Fail");

      // Try to payout a requested refund (not approved)
      // Create, pay, and request refund
      const createBooking = await request("POST", "/api/v1/bookings", {
        eventId,
        customerName: "Refund Payout Fail Test",
        customerEmail: `refundpayoutfail-${Date.now()}@example.com`,
        items: [{ ticketCategoryId: categoryId, quantity: 1 }],
      });
      const bookingData = await createBooking.json();
      const bookingId = bookingData.data.id;

      // Get amount and pay
      const getBooking = await request("GET", `/api/v1/bookings/${bookingId}`);
      const booking = await getBooking.json();
      await request("POST", `/api/v1/bookings/${bookingId}/pay`, {
        amount: booking.data.totalAmount,
      });

      // Request refund
      const refundRes = await request("POST", "/api/v1/refunds", {
        bookingId,
      });
      const refundData = await refundRes.json();
      const refundId = refundData.data.id;

      // Try to payout without approval
      const response = await request("POST", `/api/v1/refunds/${refundId}/payout`);

      expect(response.status).toBe(400);
    });
  });

  describe("Error Handling", () => {
    test("Invalid request body returns 422", async () => {
      const response = await request("POST", "/api/v1/bookings", {
        eventId: "",
        customerName: "",
        customerEmail: "invalid-email",
        items: [],
      });

      expect(response.status).toBe(422);
    });

    test("Non-existent resource returns 404", async () => {
      const response = await request("GET", "/api/v1/bookings/non-existent-booking");

      expect(response.status).toBe(404);
    });
  });
});
