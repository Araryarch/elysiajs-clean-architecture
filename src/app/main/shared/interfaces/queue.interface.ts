export interface IQueue<TPayload = unknown> {
  
  enqueue(payload: TPayload, options?: EnqueueOptions): Promise<string>;

  process(handler: (payload: TPayload) => Promise<void>): void;
}

export type EnqueueOptions = {
  
  delayMs?: number;
  
  retries?: number;
};

