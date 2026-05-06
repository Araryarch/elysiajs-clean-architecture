import { Event } from "@/domain/entities/event";
import type { EventRepository } from "@/domain/repositories/event-repository";
import { createId } from "@/shared/id";

export type CreateEventInput = {
  name: string;
  description?: string;
  venue: string;
  startAt: string;
  endAt: string;
  maxCapacity: number; // Added: Required by Event entity
  ticketCategories: Array<{
    name: string;
    price: number;
    capacity: number;
  }>;
};

export class CreateEventUseCase {
  constructor(private readonly eventRepository: EventRepository) {}

  async execute(input: CreateEventInput) {
    const event = Event.fromPrimitives({
      id: createId("evt"),
      name: input.name,
      description: input.description,
      venue: input.venue,
      startAt: new Date(input.startAt),
      endAt: new Date(input.endAt),
      maxCapacity: input.maxCapacity, // Added: Pass maxCapacity
      createdAt: new Date(),
      status: "Draft", // Added: New events start as Draft
      ticketCategories: input.ticketCategories.map((category) => ({
        id: createId("tcat"),
        name: category.name,
        price: category.price,
        capacity: category.capacity,
        bookedQuantity: 0,
      })),
    });

    await this.eventRepository.save(event);

    return event.toJSON();
  }
}
