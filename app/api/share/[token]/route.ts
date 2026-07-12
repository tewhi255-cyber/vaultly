import { NextRequest, NextResponse } from "next/server"
import { compare } from "bcryptjs"
import prisma from "@/lib/db"
import { getSignedDownloadUrl } from "@/lib/s3"

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
    include: {
      file: { include: { folder: { select: { id: true, name: true } } } },
      folder: {
        include: {
          files: { where: { isTrash: false } },
          children: { where: { isTrash: false } },
        },
      },
    },
  })

  if (!shareLink || !shareLink.isActive) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Share link not found or inactive" } }, { status: 404 })
  }

  if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
    return NextResponse.json({ error: { code: "EXPIRED", message: "Share link has expired" } }, { status: 410 })
  }

  if (shareLink.password) {
    const password = req.nextUrl.searchParams.get("password")
    if (!password) {
      return NextResponse.json({ error: { code: "PASSWORD_REQUIRED", message: "Password required" } }, { status: 401 })
    }
    const valid = await compare(password, shareLink.password)
    if (!valid) {
      return NextResponse.json({ error: { code: "INVALID_PASSWORD", message: "Invalid password" } }, { status: 403 })
    }
  }

  await prisma.shareLink.update({
    where: { id: shareLink.id },
    data: { viewCount: { increment: 1 } },
  })

  let downloadUrl: string | null = null
  if (shareLink.file && shareLink.allowDownload) {
    downloadUrl = await getSignedDownloadUrl(shareLink.file.storagePath)
  }

  return NextResponse.json({ share: shareLink, downloadUrl })
}
