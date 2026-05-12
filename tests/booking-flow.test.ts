import { describe, expect, test } from "bun:test";
import { createApp } from "../src/app/main/create-app";

describe("Booking Flow (E2E)", () => {
  test("creates a booking and pays for it", async () => {
    const app = await createApp();

    const createEventRes = await app.handle(
      new Request("http://localhost/api/v1/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "E2E Test Event",
          venue: "Test Venue",
          startAt: "2027-12-01T09:00:00Z",
          endAt: "2027-12-01T18:00:00Z",
          maxCapacity: 100,
        }),
      }),
    );
    const eventBody = await createEventRes.json();
    const eventId = eventBody.data.id;

    const salesStart = new Date(Date.now() - 86400000).toISOString();
    const salesEnd = new Date(Date.now() + 86400000 * 30).toISOString();

    const createCatRes = await app.handle(
      new Request(`http://localhost/api/v1/events/${eventId}/ticket-categories`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Regular",
          price: 150000,
          quota: 50,
          salesStart,
          salesEnd,
        }),
      }),
    );
    const catBody = await createCatRes.json();
    const categoryId = catBody.data.id;

    await app.handle(
      new Request(`http://localhost/api/v1/events/${eventId}/publish`, { method: "POST" }),
    );

    const createBookingRes = await app.handle(
      new Request("http://localhost/api/v1/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          eventId,
          customerName: "Ari",
          customerEmail: "ari@example.com",
          items: [{ ticketCategoryId: categoryId, quantity: 2 }],
        }),
      }),
    );

    expect(createBookingRes.status).toBe(200);
    const bookingBody = await createBookingRes.json();
    expect(bookingBody.success).toBe(true);
    expect(bookingBody.data.id).toBeDefined();
    const bookingId = bookingBody.data.id;

    const getBookingRes = await app.handle(
      new Request(`http://localhost/api/v1/bookings/${bookingId}`, { method: "GET" }),
    );
    const getBody = await getBookingRes.json();
    const totalAmount = getBody.data.totalAmount;

    const payRes = await app.handle(
      new Request(`http://localhost/api/v1/bookings/${bookingId}/pay`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount: totalAmount }),
      }),
    );

    expect(payRes.status).toBe(200);
    const payBody = await payRes.json();
    expect(payBody.success).toBe(true);
  });
});
