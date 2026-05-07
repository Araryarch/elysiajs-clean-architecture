import { join } from "path";
import type { IStorage } from "./storage.interface";

/**
 * Local filesystem storage implementation.
 * Stores files under the given base directory.
 * For development only — use a cloud provider in production.
 */
export class LocalStorage implements IStorage {
  constructor(private readonly baseDir: string = "./uploads") {}

  async upload(params: {
    key: string;
    data: Buffer | Uint8Array;
    contentType: string;
  }): Promise<string> {
    const filePath = join(this.baseDir, params.key);
    await Bun.write(filePath, params.data);
    return `/uploads/${params.key}`;
  }

  async download(key: string): Promise<Buffer> {
    const filePath = join(this.baseDir, key);
    const file = Bun.file(filePath);
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async delete(key: string): Promise<void> {
    const filePath = join(this.baseDir, key);
    // Bun doesn't expose unlink directly — use the Node compat layer
    const { unlink } = await import("fs/promises");
    await unlink(filePath).catch(() => {
      // Ignore if file doesn't exist
    });
  }

  async exists(key: string): Promise<boolean> {
    const filePath = join(this.baseDir, key);
    return Bun.file(filePath).exists();
  }

  async getSignedUrl(key: string, _expiresInSeconds: number): Promise<string> {
    // Local storage doesn't support signed URLs — return a plain path
    return `/uploads/${key}`;
  }
}
