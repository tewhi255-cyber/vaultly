import { Queue, Job } from "bullmq"
import IORedis from "ioredis"

let connection: IORedis | null = null
let thumbnailQueue: Queue | null = null
let transcodeQueue: Queue | null = null
let scanQueue: Queue | null = null

function getConnection(): IORedis | null {
  const url = process.env.REDIS_URL
  if (!url) return null
  if (!connection) {
    connection = new IORedis(url, { maxRetriesPerRequest: null })
  }
  return connection
}

function getQueue(name: string): Queue | null {
  const conn = getConnection()
  if (!conn) return null
  if (name === "thumbnail-generation" && thumbnailQueue) return thumbnailQueue
  if (name === "video-transcode" && transcodeQueue) return transcodeQueue
  if (name === "virus-scan" && scanQueue) return scanQueue

  const queue = new Queue(name, { connection: conn })
  if (name === "thumbnail-generation") thumbnailQueue = queue
  if (name === "video-transcode") transcodeQueue = queue
  if (name === "virus-scan") scanQueue = queue
  return queue
}

export async function addThumbnailJob(fileId: string, filePath: string, type: string) {
  const queue = getQueue("thumbnail-generation")
  if (!queue) return null
  return queue.add("generate-thumbnail", { fileId, filePath, type })
}

export async function addTranscodeJob(fileId: string, filePath: string) {
  const queue = getQueue("video-transcode")
  if (!queue) return null
  return queue.add("transcode-video", { fileId, filePath })
}

export async function addScanJob(fileId: string, filePath: string) {
  const queue = getQueue("virus-scan")
  if (!queue) return null
  return queue.add("scan-file", { fileId, filePath })
}

export function redisConnection() {
  return getConnection()
}
