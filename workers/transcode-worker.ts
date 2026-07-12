import { Worker } from "bullmq"
import { redisConnection } from "@/lib/queue"
import { getS3Client, s3Bucket } from "@/lib/s3"
import prisma from "@/lib/db"
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"

const conn = redisConnection()
if (!conn) {
  console.error("Redis not configured, transcode worker cannot start")
  process.exit(1)
}

const worker = new Worker(
  "video-transcode",
  async (job: any) => {
    const { fileId, filePath } = job.data

    try {
      const s3 = getS3Client()
      const response = await s3.send(
        new GetObjectCommand({ Bucket: s3Bucket, Key: filePath })
      )

      const buffer = Buffer.from(await response.Body!.transformToByteArray())

      // In production, use fluent-ffmpeg to transcode to H.264 MP4
      // const transcoded = await ffmpeg(buffer)
      //   .videoCodec('libx264')
      //   .audioCodec('aac')
      //   .toBuffer()

      const transcodedPath = filePath.replace(/\.[^.]+$/, "_transcoded.mp4")

      await s3.send(
        new PutObjectCommand({
          Bucket: s3Bucket,
          Key: transcodedPath,
          Body: buffer,
          ContentType: "video/mp4",
        })
      )

      await prisma.file.update({
        where: { id: fileId },
        data: { status: "READY" },
      })
    } catch (error) {
      console.error(`Transcode failed for ${fileId}:`, error)
    }
  },
  { connection: conn }
)

console.log("Transcode worker started")
