import { Event } from "@/domain/entities/event";
import type { EventRepository } from "@/domain/repositories/event-repository";

export async function seedEvents(eventRepository: EventRepository) {
  const event = Event.fromPrimitives({
    id: "seed-event-1",
    name: "Jakarta Tech Summit 2026",
    description: "Conference teknologi dengan workshop, expo, dan networking.",
    venue: "Jakarta Convention Center",
    startAt: new Date("2026-08-15T09:00:00.000Z"),
    endAt: new Date("2026-08-15T18:00:00.000Z"),
    createdAt: new Date(),
    ticketCategories: [
      {
        id: "seed-regular",
        name: "Regular",
        price: 250000,
        capacity: 500,
        bookedQuantity: 0,
      },
      {
        id: "seed-vip",
        name: "VIP",
        price: 750000,
        capacity: 100,
        bookedQuantity: 0,
      },
    ],
  });

  await eventRepository.save(event);
}
