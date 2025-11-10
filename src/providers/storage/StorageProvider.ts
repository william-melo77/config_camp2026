import { UploadParams, UploadResult } from "./types";

export abstract class StorageProvider {
  abstract uploadObject(params: UploadParams): Promise<UploadResult>;
  abstract deleteObject(bucket: string, key: string): Promise<void>;
}