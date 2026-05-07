/**
 * Generic file storage interface.
 * Implementations can be local disk, S3, GCS, etc.
 */
export interface IStorage {
  /** Upload a file and return its public URL */
  upload(params: {
    key: string;
    data: Buffer | Uint8Array;
    contentType: string;
  }): Promise<string>;

  /** Download a file by key */
  download(key: string): Promise<Buffer>;

  /** Delete a file by key */
  delete(key: string): Promise<void>;

  /** Check if a file exists */
  exists(key: string): Promise<boolean>;

  /** Get a pre-signed URL valid for the given duration */
  getSignedUrl(key: string, expiresInSeconds: number): Promise<string>;
}
