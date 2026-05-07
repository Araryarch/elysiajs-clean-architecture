/**
 * Generic job queue interface.
 * Implementations can be in-memory, BullMQ, SQS, etc.
 */
export interface IQueue<TPayload = unknown> {
  /** Enqueue a job */
  enqueue(payload: TPayload, options?: EnqueueOptions): Promise<string>;

  /** Register a worker that processes jobs */
  process(handler: (payload: TPayload) => Promise<void>): void;
}

export type EnqueueOptions = {
  /** Delay before the job becomes available (ms) */
  delayMs?: number;
  /** Number of retry attempts on failure */
  retries?: number;
};
