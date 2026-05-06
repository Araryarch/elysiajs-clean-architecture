import { Elysia, t } from "elysia";
import type { CreateEventUseCase } from "@/application/use-cases/create-event";
import type { GetEventUseCase } from "@/application/use-cases/get-event";
import type { ListEventsUseCase } from "@/application/use-cases/list-events";

type EventRouteDeps = {
  createEvent: CreateEventUseCase;
  getEvent: GetEventUseCase;
  listEvents: ListEventsUseCase;
};

export function eventRoutes(deps: EventRouteDeps) {
  return new Elysia({ prefix: "/events" })
    .get("/", async () => deps.listEvents.execute())
    .get(
      "/:id",
      async ({ params }) => deps.getEvent.execute(params.id),
      {
        params: t.Object({
          id: t.String({ minLength: 1 }),
        }),
      },
    )
    .post(
      "/",
      async ({ body, set }) => {
        set.status = 201;
        return deps.createEvent.execute(body);
      },
      {
        body: t.Object({
          name: t.String({ minLength: 1 }),
          description: t.Optional(t.String()),
          venue: t.String({ minLength: 1 }),
          startAt: t.String({ format: "date-time" }),
          endAt: t.String({ format: "date-time" }),
          ticketCategories: t.Array(
            t.Object({
              name: t.String({ minLength: 1 }),
              price: t.Number({ minimum: 0 }),
              capacity: t.Integer({ minimum: 1 }),
            }),
            { minItems: 1 },
          ),
        }),
      },
    );
}
