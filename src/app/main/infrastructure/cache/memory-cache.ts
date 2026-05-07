import type { ICache } from "./cache.interface";

type CacheEntry<T> = {
  value: T;
  expiresAt: number | null; // null = no expiry
};

/**
 * Simple in-memory cache implementation.
 * Suitable for development and single-instance deployments.
 * Use a Redis-backed implementation for multi-instance/production.
 */
export class MemoryCache implements ICache {
  private store = new Map<string, CacheEntry<unknown>>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}
