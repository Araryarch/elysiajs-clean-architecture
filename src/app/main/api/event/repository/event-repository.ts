import type { Event } from "../../../entities/event/event";

export interface EventRepository {
  findAll(): Promise<Event[]>;
  findById(id: string): Promise<Event | null>;
  save(event: Event): Promise<void>;
  delete(id: string): Promise<void>;
}
