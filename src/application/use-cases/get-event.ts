import { NotFoundError } from "@/domain/errors/domain-error";
import type { EventRepository } from "@/domain/repositories/event-repository";

export class GetEventUseCase {
  constructor(private readonly eventRepository: EventRepository) {}

  async execute(id: string) {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw new NotFoundError("Event");
    }

    return event.toJSON();
  }
}
