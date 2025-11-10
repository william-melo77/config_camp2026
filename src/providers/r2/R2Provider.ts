import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Config } from "../../config/env";
import { StorageProvider } from "../storage/StorageProvider";
import { UploadParams, UploadResult } from "../storage/types";

export class R2Provider extends StorageProvider {
  private client: S3Client;

  constructor() {
    super();

    if (!r2Config.enabled) {
      throw new Error("R2 no está habilitado: establece R2_ENABLED=true en el entorno");
    }
    if (!r2Config.endpoint || !r2Config.accessKeyId || !r2Config.secretAccessKey) {
      throw new Error("R2 config incompleta: endpoint, accessKeyId y secretAccessKey son requeridos");
    }

    this.client = new S3Client({
      region: r2Config.region || "auto",
      endpoint: r2Config.endpoint,
      credentials: {
        accessKeyId: r2Config.accessKeyId!,
        secretAccessKey: r2Config.secretAccessKey!,
      },
      forcePathStyle: true,
    });
  }

  async uploadObject(params: UploadParams): Promise<UploadResult> {
    const { bucket, key, body, contentType, metadata } = params;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: metadata,
    });

    const result = await this.client.send(command);

    return {
      bucket,
      key,
      etag: result.ETag || "",
    };
  }

  async deleteObject(bucket: string, key: string): Promise<void> {
    const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
    await this.client.send(command);
  }

  async getPresignedPutUrl(
    bucket: string,
    key: string,
    contentType: string,
    expiresInSeconds: number = 300
  ): Promise<{ uploadUrl: string; publicUrl: string; expiresIn: number; key: string }> {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
    });

    // Construir URL pública sólo si el bucket es público
    let publicUrl = "";
    if (r2Config.bucketPublic) {
      const base = (r2Config.publicBaseUrl || r2Config.endpoint || "").replace(/\/+$/, "");
      publicUrl = base ? `${base}/${bucket}/${key}` : "";
    }

    return { uploadUrl, publicUrl, expiresIn: expiresInSeconds, key };
  }

  async getPresignedGetUrl(
    bucket: string,
    key: string,
    expiresInSeconds: number = 300
  ): Promise<{ downloadUrl: string; expiresIn: number; key: string }> {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });

    const downloadUrl = await getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
    });

    return { downloadUrl, expiresIn: expiresInSeconds, key };
  }
}