import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AWS_ACCESS_KEY_ID, AWS_REGION, AWS_SECRET_ACCESS_KEY, S3_BUCKET } from '$app/env/private';

// Presigned links expire after five minutes. Each page load or upload asks for a new one.
const LINK_TTL_SECONDS = 300;

let client: S3Client | null = null;

// Created on first use so a missing setting only fails the request that needs S3.
function s3(): S3Client {
  if (!client) {
    if (!AWS_REGION) throw new Error('AWS_REGION is not set. Add it to .env.');
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set in .env.');
    }
    client = new S3Client({
      region: AWS_REGION,
      credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY },
      // Stops the SDK from adding a checksum to presigned URLs. The browser PUT would otherwise
      // fail because the checksum is for an empty body.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED'
    });
  }
  return client;
}

function bucket(): string {
  if (!S3_BUCKET) throw new Error('S3_BUCKET is not set. Add it to .env.');
  return S3_BUCKET;
}

// One bucket for all companies. Each company's files sit under its own id prefix.
export function documentStorageKey(companyId: string, documentId: string): string {
  return `${companyId}/${documentId}`;
}

// The browser PUTs the file to this URL. It must send the same content type that was signed.
export function createUploadUrl(key: string, contentType: string): Promise<string> {
  return getSignedUrl(
    s3(),
    new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType }),
    { expiresIn: LINK_TTL_SECONDS }
  );
}

export function createDownloadUrl(key: string): Promise<string> {
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: bucket(), Key: key }), {
    expiresIn: LINK_TTL_SECONDS
  });
}

// S3 treats deleting a missing key as success.
export async function deleteObject(key: string): Promise<void> {
  await s3().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
}

// Returns the stored file's size in bytes, or null if no file exists at the key.
export async function getObjectSize(key: string): Promise<number | null> {
  try {
    const head = await s3().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
    return head.ContentLength ?? null;
  } catch (err) {
    if (err instanceof Error && err.name === 'NotFound') return null;
    throw err;
  }
}
