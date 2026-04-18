import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "../config/env";

export const s3Client = new S3Client({
  region: env.S3_REGION,
  credentials:
    env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY
        }
      : undefined
});

const MAX_UPLOAD_ATTEMPTS = 3;

interface UploadToS3Params {
  key: string;
  body: Buffer;
  contentType: string;
}

export function buildS3FileUrl(key: string): string {
  if (env.S3_PUBLIC_BASE_URL) {
    return `${env.S3_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`;
  }

  if (!env.S3_BUCKET) {
    throw new Error("S3 bucket is not configured");
  }

  return `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${key}`;
}

export async function uploadBufferToS3(params: UploadToS3Params): Promise<void> {
  if (!env.S3_BUCKET) {
    throw new Error("S3 bucket is not configured");
  }

  for (let attempt = 1; attempt <= MAX_UPLOAD_ATTEMPTS; attempt += 1) {
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: env.S3_BUCKET,
          Key: params.key,
          Body: params.body,
          ContentType: params.contentType
        })
      );
      return;
    } catch (error) {
      if (attempt === MAX_UPLOAD_ATTEMPTS) {
        throw error;
      }

      const backoffMs = attempt * 300;
      await new Promise((resolve) => {
        setTimeout(resolve, backoffMs);
      });
    }
  }
}

export async function deleteFileFromS3(key: string): Promise<void> {
  if (!env.S3_BUCKET) {
    throw new Error("S3 bucket is not configured");
  }

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key
    })
  );
}

export async function createPresignedGetObjectUrl(key: string, expiresInSeconds: number): Promise<string> {
  if (!env.S3_BUCKET) {
    throw new Error("S3 bucket is not configured");
  }

  return getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key
    }),
    {
      expiresIn: expiresInSeconds
    }
  );
}
