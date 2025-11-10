export enum StorageProviderType {
  R2 = "r2",
}

export type UploadParams = {
  bucket: string;
  key: string;
  body: Buffer | Uint8Array;
  contentType?: string;
  metadata?: Record<string, string>;
};

export type UploadResult = {
  bucket: string;
  key: string;
  etag: string;
};