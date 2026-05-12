import { describe, expect, it, beforeEach } from "bun:test";
import { CreateEventCommand, CreateEventHandler } from "../../api/event/controller/create-event.controller";
import { PublishEventCommand, PublishEventHandler } from "../../api/event/controller/publish-event.controller";
import { CancelEventCommand, CancelEventHandler } from "../../api/event/controller/cancel-event.controller";
import { GetEventQuery, GetEventHandler } from "../../api/event/controller/get-event.controller";
import { EventStatus } from "../../entities/event/event-status";
import { EventBus } from "../../infrastructure/events/event-bus";
import { createFakeRepositories } from "../helpers/fake-repositories";
import { makePublishedEvent, makeEvent, makeCategory, future, past } from "../helpers/test-factory";
import { DateRange } from "../../domain/value-objects/date-range";

describe("CreateEventHandler (integration)", () => {
  let repos: ReturnType<typeof createFakeRepositories>;

  beforeEach(() => {
    repos = createFakeRepositories();
  });

  it("creates an event and persists it", async () => {
    const handler = new CreateEventHandler(repos.eventRepo);
    const eventId = await handler.execute(
      new CreateEventCommand("New Event", "Desc", "Venue", future(10), future(11), 200, []),
    );

    const saved = await repos.eventRepo.findById(eventId);
    expect(saved).not.toBeNull();
    expect(saved!.status).toBe(EventStatus.DRAFT);
    expect(saved!.id).toBe(eventId);
  });
});

describe("PublishEventHandler (integration)", () => {
  let repos: ReturnType<typeof createFakeRepositories>;

  beforeEach(() => {
    repos = createFakeRepositories();
  });

  it("publishes a draft event with ticket categories", async () => {
    const event = makeEvent({ id: "event-to-publish" });
    const cat = makeCategory("event-to-publish", { salesPeriod: new DateRange(past(1), future(9)) });
    event.addTicketCategory(cat);
    await repos.eventRepo.save(event);

    const handler = new PublishEventHandler(repos.eventRepo);
    await handler.execute(new PublishEventCommand("event-to-publish"));

    const saved = await repos.eventRepo.findById("event-to-publish");
    expect(saved!.status).toBe(EventStatus.PUBLISHED);
  });
});

describe("CancelEventHandler (integration)", () => {
  let repos: ReturnType<typeof createFakeRepositories>;
  let eventBus: EventBus;

  beforeEach(() => {
    repos = createFakeRepositories();
    eventBus = new EventBus();
  });

  it("cancels a published event", async () => {
    const event = makePublishedEvent("event-to-cancel");
    event.clearDomainEvents();
    await repos.eventRepo.save(event);

    const handler = new CancelEventHandler(repos.eventRepo, eventBus);
    await handler.execute(new CancelEventCommand("event-to-cancel"));

    const saved = await repos.eventRepo.findById("event-to-cancel");
    expect(saved!.status).toBe(EventStatus.CANCELLED);
  });
});

describe("GetEventHandler (integration)", () => {
  let repos: ReturnType<typeof createFakeRepositories>;

  beforeEach(() => {
    repos = createFakeRepositories();
  });

  it("returns event details", async () => {
    const event = makePublishedEvent("event-to-get");
    event.clearDomainEvents();
    await repos.eventRepo.save(event);

    const handler = new GetEventHandler(repos.eventRepo);
    const result = await handler.execute(new GetEventQuery("event-to-get"));

    expect(result).not.toBeNull();
    expect(result.id).toBe("event-to-get");
  });

  it("throws for non-existent event", async () => {
    const handler = new GetEventHandler(repos.eventRepo);
    await expect(handler.execute(new GetEventQuery("non-existent"))).rejects.toThrow("not found");
  });
});

