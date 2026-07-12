import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const endpoint = process.env.S3_ENDPOINT || "http://localhost:9000"
const region = process.env.S3_REGION || "us-east-1"
const bucket = process.env.S3_BUCKET || "vaultly"

let client: S3Client | null = null

export function getS3Client(): S3Client {
  if (!client) {
    client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin",
        secretAccessKey: process.env.S3_SECRET_KEY || "minioadmin",
      },
      forcePathStyle: true,
    })
  }
  return client
}

export async function uploadToS3(
  key: string,
  body: Buffer | Uint8Array | Blob,
  contentType: string
): Promise<void> {
  const s3 = getS3Client()
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )
}

export async function getFromS3(key: string): Promise<Uint8Array> {
  const s3 = getS3Client()
  const response = await s3.send(
    new GetObjectCommand({ Bucket: bucket, Key: key })
  )
  return response.Body!.transformToByteArray()
}

export async function deleteFromS3(key: string): Promise<void> {
  const s3 = getS3Client()
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}

export async function getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  const s3 = getS3Client()
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn }
  )
}

export async function ensureBucket(): Promise<void> {
  const s3 = getS3Client()
  try {
    await s3.send(
      new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 })
    )
  } catch {
    // Bucket doesn't exist, create it via MakeBucket command
    // For MinIO, we can use PutBucketCommand
    const { CreateBucketCommand } = await import("@aws-sdk/client-s3")
    await s3.send(new CreateBucketCommand({ Bucket: bucket }))
  }
}

export { bucket as s3Bucket }
