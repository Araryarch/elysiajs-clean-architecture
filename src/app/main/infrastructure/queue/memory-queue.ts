import { createId } from "@/app/main/shared/utils/helpers/id";
import type { EnqueueOptions, IQueue } from "./queue.interface";

/**
 * In-memory queue implementation.
 * Jobs are processed immediately in the same process.
 * For development only — use BullMQ or SQS in production.
 */
export class MemoryQueue<TPayload = unknown> implements IQueue<TPayload> {
  private handler: ((payload: TPayload) => Promise<void>) | null = null;

  async enqueue(payload: TPayload, options?: EnqueueOptions): Promise<string> {
    const jobId = createId("job");
    const delayMs = options?.delayMs ?? 0;

    setTimeout(async () => {
      if (!this.handler) return;
      try {
        await this.handler(payload);
      } catch (err) {
        console.error(`[MemoryQueue] Job ${jobId} failed:`, err);
      }
    }, delayMs);

    return jobId;
  }

  process(handler: (payload: TPayload) => Promise<void>): void {
    this.handler = handler;
  }
}
