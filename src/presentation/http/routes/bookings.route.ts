import { Elysia, t } from "elysia";
import type { CancelBookingUseCase } from "@/application/use-cases/cancel-booking";
import type { ConfirmBookingUseCase } from "@/application/use-cases/confirm-booking";
import type { CreateBookingUseCase } from "@/application/use-cases/create-booking";
import type { GetBookingUseCase } from "@/application/use-cases/get-booking";

type BookingRouteDeps = {
  cancelBooking: CancelBookingUseCase;
  confirmBooking: ConfirmBookingUseCase;
  createBooking: CreateBookingUseCase;
  getBooking: GetBookingUseCase;
};

export function bookingRoutes(deps: BookingRouteDeps) {
  return new Elysia({ prefix: "/bookings" })
    .post(
      "/",
      async ({ body, set }) => {
        set.status = 201;
        return deps.createBooking.execute(body);
      },
      {
        body: t.Object({
          eventId: t.String({ minLength: 1 }),
          customerName: t.String({ minLength: 1 }),
          customerEmail: t.String({ format: "email" }),
          items: t.Array(
            t.Object({
              ticketCategoryId: t.String({ minLength: 1 }),
              quantity: t.Integer({ minimum: 1 }),
            }),
            { minItems: 1 },
          ),
        }),
      },
    )
    .get(
      "/:id",
      async ({ params }) => deps.getBooking.execute(params.id),
      {
        params: t.Object({
          id: t.String({ minLength: 1 }),
        }),
      },
    )
    .post(
      "/:id/confirm",
      async ({ params }) => deps.confirmBooking.execute(params.id),
      {
        params: t.Object({
          id: t.String({ minLength: 1 }),
        }),
      },
    )
    .post(
      "/:id/cancel",
      async ({ params }) => deps.cancelBooking.execute(params.id),
      {
        params: t.Object({
          id: t.String({ minLength: 1 }),
        }),
      },
    );
}
