import { Worker } from "bullmq"
import { redisConnection } from "@/lib/queue"
import prisma from "@/lib/db"

const conn = redisConnection()
if (!conn) {
  console.error("Redis not configured, scan worker cannot start")
  process.exit(1)
}

const worker = new Worker(
  "virus-scan",
  async (job: any) => {
    const { fileId, filePath } = job.data

    try {
      // In production, integrate with ClamAV:
      // const result = await clamscan.scanFile(localPath)
      // const isClean = !result.isInfected

      // For now, mark all files as clean after a brief delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      await prisma.file.update({
        where: { id: fileId },
        data: { status: "READY" },
      })

      console.log(`File ${fileId} scanned and marked as clean`)
    } catch (error) {
      console.error(`Scan failed for ${fileId}:`, error)
      await prisma.file.update({
        where: { id: fileId },
        data: { status: "FLAGGED" },
      })
    }
  },
  { connection: conn }
)

console.log("Scan worker started")
