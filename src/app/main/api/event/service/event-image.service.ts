import { IStorage } from "../../../shared/interfaces/storage.interface";
import { createId } from "../../../shared/utils/helpers/id";

export interface IEventImageService {
  uploadBanner(eventId: string, data: Buffer, contentType: string): Promise<string>;
  deleteBanner(eventId: string): Promise<void>;
  getBannerUrl(eventId: string): Promise<string | null>;
}

export class EventImageService implements IEventImageService {
  constructor(private storage: IStorage) {}

  async uploadBanner(eventId: string, data: Buffer, contentType: string): Promise<string> {
    const key = `events/${eventId}/banner-${createId("img")}`;
    return this.storage.upload({ key, data, contentType });
  }

  async deleteBanner(eventId: string): Promise<void> {
    const key = `events/${eventId}/banner`;
    const exists = await this.storage.exists(key);
    if (exists) {
      await this.storage.delete(key);
    }
  }

  async getBannerUrl(eventId: string): Promise<string | null> {
    const key = `events/${eventId}/banner`;
    const exists = await this.storage.exists(key);
    if (!exists) return null;
    return this.storage.getSignedUrl(key, 3600);
  }
}
