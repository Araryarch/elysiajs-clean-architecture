import { describe, expect, test } from "bun:test";
import { createApp } from "../src/app/main/create-app";

describe("booking flow", () => {
  test("creates and confirms a booking from seeded event inventory", async () => {
    const app = await createApp();

    const createBookingResponse = await app.handle(
      new Request("http://localhost/bookings", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          eventId: "seed-event-1",
          customerName: "Ari",
          customerEmail: "ari@example.com",
          items: [{ ticketCategoryId: "seed-vip", quantity: 2 }],
        }),
      }),
    );

    expect(createBookingResponse.status).toBe(201);

    const booking = await createBookingResponse.json();

    expect(booking.status).toBe("PENDING");
    expect(booking.totalAmount).toBe(1_500_000);

    const confirmResponse = await app.handle(
      new Request(`http://localhost/bookings/${booking.id}/confirm`, {
        method: "POST",
      }),
    );

    expect(confirmResponse.status).toBe(200);
    expect(await confirmResponse.json()).toMatchObject({
      id: booking.id,
      status: "CONFIRMED",
    });
  });
});
