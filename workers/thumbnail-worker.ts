import { Worker } from "bullmq"
import { redisConnection } from "@/lib/queue"
import { getS3Client, s3Bucket } from "@/lib/s3"
import prisma from "@/lib/db"
import sharp from "sharp"
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { spawn } from "child_process"
import path from "path"
import os from "os"
import fs from "fs/promises"

const conn = redisConnection()
if (!conn) {
  console.error("Redis not configured, thumbnail worker cannot start")
  process.exit(1)
}

const worker = new Worker(
  "thumbnail-generation",
  async (job: any) => {
    const { fileId, filePath, type } = job.data

    try {
      const s3 = getS3Client()
      const response = await s3.send(
        new GetObjectCommand({ Bucket: s3Bucket, Key: filePath })
      )

      const buffer = Buffer.from(await response.Body!.transformToByteArray())
      let thumbnailBuffer: Buffer
      let thumbnailPath: string

      if (type === "IMAGE") {
        thumbnailBuffer = await sharp(buffer)
          .resize(400, 300, { fit: "cover", position: "centre" })
          .webp({ quality: 80 })
          .toBuffer()

        thumbnailPath = filePath.replace(/\.[^.]+$/, "_thumb.webp")
      } else if (type === "VIDEO") {
        // Extract a frame from video using ffmpeg
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vaultly-thumb-"))
        const inputPath = path.join(tmpDir, "input")
        const outputPath = path.join(tmpDir, "frame.jpg")

        await fs.writeFile(inputPath, buffer)

        await new Promise<void>((resolve, reject) => {
          const ff = spawn("ffmpeg", [
            "-i", inputPath,
            "-ss", "00:00:01",
            "-vframes", "1",
            "-q:v", "2",
            outputPath,
          ])
          ff.on("close", (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg exit code ${code}`)))
          ff.on("error", reject)
        })

        const frameBuffer = await fs.readFile(outputPath)
        thumbnailBuffer = await sharp(frameBuffer)
          .resize(400, 300, { fit: "cover", position: "centre" })
          .webp({ quality: 80 })
          .toBuffer()

        await fs.rm(tmpDir, { recursive: true, force: true })
        thumbnailPath = filePath.replace(/\.[^.]+$/, "_thumb.webp")
      } else {
        return
      }

      await s3.send(
        new PutObjectCommand({
          Bucket: s3Bucket,
          Key: thumbnailPath,
          Body: thumbnailBuffer,
          ContentType: "image/webp",
        })
      )

      await prisma.file.update({
        where: { id: fileId },
        data: { thumbnailPath },
      })
    } catch (error) {
      console.error(`Thumbnail generation failed for ${fileId}:`, error)
    }
  },
  { connection: conn }
)

console.log("Thumbnail worker started")
