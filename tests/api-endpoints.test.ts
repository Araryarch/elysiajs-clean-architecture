import { describe, expect, test, beforeAll } from "bun:test";
import { createApp } from "../src/app/main/create-app";

describe("API Endpoints Integration Tests", () => {
  let app: Awaited<ReturnType<typeof createApp>>;

  beforeAll(async () => {
    app = await createApp();
  });

  // Helper function to make requests
  const request = (method: string, path: string, body?: Record<string, unknown>) => {
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
      salesStart: "2026-05-01T00:00:00Z",
      salesEnd: "2027-11-30T23:59:59Z",
    });
    const categoryData = await createCategory.json();
    const categoryId = categoryData.data.id;

    await request("POST", `/api/v1/events/${eventId}/publish`);

    return { eventId, categoryId };
  };

  describe("Events Endpoints", () => {
    test("GET /api/v1/events/:id - Get event details", async () => {
      const response = await request("GET", "/api/v1/events/event_published-001");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe("event_published-001");
    });

    test("GET /api/v1/events/:id - Non-existent event returns 404", async () => {
      const response = await request("GET", "/api/v1/events/non-existent");
      expect(response.status).toBe(404);
    });

    test("POST /api/v1/events - Create new event", async () => {
      const response = await request("POST", "/api/v1/events", {
        name: "Test Event Integration",
        description: "Test event",
        venue: "Test Venue",
        startAt: "2027-12-01T09:00:00Z",
        endAt: "2027-12-01T18:00:00Z",
        maxCapacity: 100,
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBeDefined();
    });

    test("POST /api/v1/events/:id/ticket-categories - Add ticket category", async () => {
      const createEvent = await request("POST", "/api/v1/events", {
        name: "Event for Category Test",
        venue: "Test Venue",
        startAt: "2027-12-01T09:00:00Z",
        endAt: "2027-12-01T18:00:00Z",
        maxCapacity: 100,
      });
      const eventData = await createEvent.json();
      const eventId = eventData.data.id;

      const response = await request("POST", `/api/v1/events/${eventId}/ticket-categories`, {
        name: "Test Category",
        price: 150000,
        quota: 50,
        salesStart: "2026-05-01T00:00:00Z",
        salesEnd: "2027-11-30T23:59:59Z",
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBeDefined();
    });

    test("POST /api/v1/events/:id/ticket-categories/:categoryId/disable - Disable ticket category", async () => {
      const createEvent = await request("POST", "/api/v1/events", {
        name: "Event for Disable Category",
        venue: "Test Venue",
        startAt: "2027-12-01T09:00:00Z",
        endAt: "2027-12-01T18:00:00Z",
        maxCapacity: 100,
      });
      const eventData = await createEvent.json();
      const eventId = eventData.data.id;

      const createCategory = await request("POST", `/api/v1/events/${eventId}/ticket-categories`, {
        name: "Category to Disable",
        price: 100000,
        quota: 50,
        salesStart: "2026-05-01T00:00:00Z",
        salesEnd: "2027-11-30T23:59:59Z",
      });
      const categoryData = await createCategory.json();
      const categoryId = categoryData.data.id;

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

    test("POST /api/v1/bookings - Cannot create duplicate booking", async () => {
      const { eventId, categoryId } = await createTestEvent("Test Event for Duplicate");
      const email = `duplicate-${Date.now()}@example.com`;

      await request("POST", "/api/v1/bookings", {
        eventId,
        customerName: "Duplicate Test",
        customerEmail: email,
        items: [{ ticketCategoryId: categoryId, quantity: 1 }],
      });

      const response = await request("POST", "/api/v1/bookings", {
        eventId,
        customerName: "Duplicate Test",
        customerEmail: email,
        items: [{ ticketCategoryId: categoryId, quantity: 1 }],
      });

      expect(response.status).toBe(409);
    });

    test("GET /api/v1/bookings/:id - Get booking details", async () => {
      const response = await request("GET", "/api/v1/bookings/booking_paid-001");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe("booking_paid-001");
    });

    test("POST /api/v1/bookings/:id/pay - Pay for booking", async () => {
      const { eventId, categoryId } = await createTestEvent("Test Event for Pay");

      const createBooking = await request("POST", "/api/v1/bookings", {
        eventId,
        customerName: "Pay Test",
        customerEmail: `pay-${Date.now()}@example.com`,
        items: [{ ticketCategoryId: categoryId, quantity: 1 }],
      });
      const bookingData = await createBooking.json();
      const bookingId = bookingData.data.id;

      const getBooking = await request("GET", `/api/v1/bookings/${bookingId}`);
      const booking = await getBooking.json();

      const response = await request("POST", `/api/v1/bookings/${bookingId}/pay`, {
        amount: booking.data.totalAmount,
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    test("POST /api/v1/bookings/:id/pay - Cannot pay with wrong amount", async () => {
      const { eventId, categoryId } = await createTestEvent("Test Event for Wrong Amount");

      const createBooking = await request("POST", "/api/v1/bookings", {
        eventId,
        customerName: "Wrong Amount Test",
        customerEmail: `wrongamount-${Date.now()}@example.com`,
        items: [{ ticketCategoryId: categoryId, quantity: 1 }],
      });
      const bookingData = await createBooking.json();
      const bookingId = bookingData.data.id;

      const response = await request("POST", `/api/v1/bookings/${bookingId}/pay`, {
        amount: 1000,
      });

      expect(response.status).toBe(400);
    });

    test("GET /api/v1/bookings/:id/tickets - Get booking tickets", async () => {
      const response = await request("GET", "/api/v1/bookings/booking_paid-001/tickets");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  describe("Tickets Endpoints", () => {
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

      const createBooking = await request("POST", "/api/v1/bookings", {
        eventId,
        customerName: "Refund Test",
        customerEmail: `refund-${Date.now()}@example.com`,
        items: [{ ticketCategoryId: categoryId, quantity: 1 }],
      });
      const bookingData = await createBooking.json();
      const bookingId = bookingData.data.id;

      const getBooking = await request("GET", `/api/v1/bookings/${bookingId}`);
      const booking = await getBooking.json();
      await request("POST", `/api/v1/bookings/${bookingId}/pay`, {
        amount: booking.data.totalAmount,
      });

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

      const createBooking = await request("POST", "/api/v1/bookings", {
        eventId,
        customerName: "Refund Test Unpaid",
        customerEmail: `refundunpaid-${Date.now()}@example.com`,
        items: [{ ticketCategoryId: categoryId, quantity: 1 }],
      });
      const bookingData = await createBooking.json();
      const bookingId = bookingData.data.id;

      const response = await request("POST", "/api/v1/refunds", {
        bookingId,
      });

      expect(response.status).toBe(400);
    });

    test("POST /api/v1/refunds/:id/approve - Approve refund request", async () => {
      const { eventId, categoryId } = await createTestEvent("Test Event for Approve Refund");

      const createBooking = await request("POST", "/api/v1/bookings", {
        eventId,
        customerName: "Refund Approve Test",
        customerEmail: `refundapprove-${Date.now()}@example.com`,
        items: [{ ticketCategoryId: categoryId, quantity: 1 }],
      });
      const bookingData = await createBooking.json();
      const bookingId = bookingData.data.id;

      const getBooking = await request("GET", `/api/v1/bookings/${bookingId}`);
      const booking = await getBooking.json();
      await request("POST", `/api/v1/bookings/${bookingId}/pay`, {
        amount: booking.data.totalAmount,
      });

      const refundRes = await request("POST", "/api/v1/refunds", {
        bookingId,
      });
      const refundData = await refundRes.json();
      const refundId = refundData.data.id;

      const response = await request("POST", `/api/v1/refunds/${refundId}/approve`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    test("POST /api/v1/refunds/:id/reject - Reject refund request", async () => {
      const { eventId, categoryId } = await createTestEvent("Test Event for Reject Refund");

      const createBooking = await request("POST", "/api/v1/bookings", {
        eventId,
        customerName: "Refund Reject Test",
        customerEmail: `refundreject-${Date.now()}@example.com`,
        items: [{ ticketCategoryId: categoryId, quantity: 1 }],
      });
      const bookingData = await createBooking.json();
      const bookingId = bookingData.data.id;

      const getBooking = await request("GET", `/api/v1/bookings/${bookingId}`);
      const booking = await getBooking.json();
      await request("POST", `/api/v1/bookings/${bookingId}/pay`, {
        amount: booking.data.totalAmount,
      });

      const refundRes = await request("POST", "/api/v1/refunds", {
        bookingId,
      });
      const refundData = await refundRes.json();
      const refundId = refundData.data.id;

      const response = await request("POST", `/api/v1/refunds/${refundId}/reject`, {
        reason: "Test rejection reason",
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    test("POST /api/v1/refunds/:id/payout - Payout approved refund", async () => {
      const { eventId, categoryId } = await createTestEvent("Test Event for Payout Refund");

      const createBooking = await request("POST", "/api/v1/bookings", {
        eventId,
        customerName: "Refund Payout Test",
        customerEmail: `refundpayout-${Date.now()}@example.com`,
        items: [{ ticketCategoryId: categoryId, quantity: 1 }],
      });
      const bookingData = await createBooking.json();
      const bookingId = bookingData.data.id;

      const getBooking = await request("GET", `/api/v1/bookings/${bookingId}`);
      const booking = await getBooking.json();
      await request("POST", `/api/v1/bookings/${bookingId}/pay`, {
        amount: booking.data.totalAmount,
      });

      const refundRes = await request("POST", "/api/v1/refunds", {
        bookingId,
      });
      const refundData = await refundRes.json();
      const refundId = refundData.data.id;

      await request("POST", `/api/v1/refunds/${refundId}/approve`);

      const response = await request("POST", `/api/v1/refunds/${refundId}/payout`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    test("POST /api/v1/refunds/:id/payout - Cannot payout non-approved refund", async () => {
      const { eventId, categoryId } = await createTestEvent("Test Event for Payout Fail");

      const createBooking = await request("POST", "/api/v1/bookings", {
        eventId,
        customerName: "Refund Payout Fail Test",
        customerEmail: `refundpayoutfail-${Date.now()}@example.com`,
        items: [{ ticketCategoryId: categoryId, quantity: 1 }],
      });
      const bookingData = await createBooking.json();
      const bookingId = bookingData.data.id;

      const getBooking = await request("GET", `/api/v1/bookings/${bookingId}`);
      const booking = await getBooking.json();
      await request("POST", `/api/v1/bookings/${bookingId}/pay`, {
        amount: booking.data.totalAmount,
      });

      const refundRes = await request("POST", "/api/v1/refunds", {
        bookingId,
      });
      const refundData = await refundRes.json();
      const refundId = refundData.data.id;

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
