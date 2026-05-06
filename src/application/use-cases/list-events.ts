import type { EventRepository } from "@/domain/repositories/event-repository";

export class ListEventsUseCase {
  constructor(private readonly eventRepository: EventRepository) {}

  async execute() {
    const events = await this.eventRepository.findAll();
    return events.map((event) => event.toJSON());
  }
}
