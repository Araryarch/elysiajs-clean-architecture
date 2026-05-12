export interface IStorage {
  
  upload(params: {
    key: string;
    data: Buffer | Uint8Array;
    contentType: string;
  }): Promise<string>;

  download(key: string): Promise<Buffer>;

  delete(key: string): Promise<void>;

  exists(key: string): Promise<boolean>;

  getSignedUrl(key: string, expiresInSeconds: number): Promise<string>;
}

