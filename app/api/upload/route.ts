import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { uploadToS3, ensureBucket, s3Bucket } from "@/lib/s3"
import prisma from "@/lib/db"
import { addThumbnailJob, addScanJob } from "@/lib/queue"
import { validateExtension, validateFileSize, validateFileSignature, sanitizeFileName } from "@/lib/file-validation"
import { generateId } from "@/lib/utils"
import { rateLimit } from "@/lib/rate-limit"
import { logActivity, extractLogContext } from "@/lib/audit"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 })
  }

    const ctx = extractLogContext(req)
  const { success } = rateLimit(`upload:${session.user.id}`, 50, 60000)
  if (!success) {
    return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Too many uploads. Try again later." } }, { status: 429 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const folderId = formData.get("folderId") as string | null

    if (!file) {
      return NextResponse.json({ error: { code: "NO_FILE", message: "No file provided" } }, { status: 400 })
    }

    const originalName = file.name
    if (!validateExtension(originalName)) {
      return NextResponse.json({ error: { code: "INVALID_TYPE", message: "File type not allowed" } }, { status: 400 })
    }

    if (!validateFileSize(file.size)) {
      return NextResponse.json({ error: { code: "FILE_TOO_LARGE", message: "File exceeds size limit" } }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const signature = await validateFileSignature(buffer)
    if (!signature.valid) {
      return NextResponse.json({ error: { code: "INVALID_SIGNATURE", message: signature.error } }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) {
      return NextResponse.json({ error: { code: "USER_NOT_FOUND", message: "User not found" } }, { status: 404 })
    }

    const currentUsage = Number(user.storageUsed)
    if (currentUsage + file.size > Number(user.storageQuota)) {
      return NextResponse.json({ error: { code: "QUOTA_EXCEEDED", message: "Storage quota exceeded" } }, { status: 413 })
    }

    const ext = originalName.split(".").pop()?.toLowerCase() || "bin"
    const safeName = sanitizeFileName(originalName)
    const fileId = generateId()
    const storagePath = `users/${session.user.id}/${fileId}.${ext}`

    const detectedMime = signature.detectedMime || file.type || "application/octet-stream"

    let fileType: string = "OTHER"
    if (detectedMime.startsWith("image/")) fileType = "IMAGE"
    else if (detectedMime.startsWith("video/")) fileType = "VIDEO"
    else if (detectedMime.startsWith("audio/")) fileType = "AUDIO"
    else if (detectedMime.includes("pdf")) fileType = "DOCUMENT"

    await ensureBucket()
    await uploadToS3(storagePath, buffer, detectedMime)

    const dbFile = await prisma.file.create({
      data: {
        id: fileId,
        name: safeName,
        originalName,
        extension: ext,
        mimeType: detectedMime,
        size: file.size,
        storagePath,
        type: fileType as any,
        status: "SCANNING",
        folderId: folderId || undefined,
        userId: session.user.id,
        checksum: "",
      },
    })

    await prisma.user.update({
      where: { id: session.user.id },
      data: { storageUsed: { increment: file.size } },
    })

    await logActivity(session.user.id, "upload", "file", dbFile.id, { name: originalName, size: file.size, type: fileType }, ctx)

    addScanJob(dbFile.id, storagePath).catch(() => {})

    if (fileType === "IMAGE" || fileType === "VIDEO") {
      addThumbnailJob(dbFile.id, storagePath, fileType).catch(() => {})
    }

    return NextResponse.json({ file: dbFile }, { status: 201 })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: { code: "UPLOAD_FAILED", message: "Failed to upload file" } }, { status: 500 })
  }
}
