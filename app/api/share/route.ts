import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { createShareLinkSchema } from "@/lib/validations"
import { generateId } from "@/lib/utils"
import { logActivity, extractLogContext } from "@/lib/audit"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 })
  }

  const ctx = extractLogContext(req)
  const body = await req.json()
  const parsed = createShareLinkSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } }, { status: 400 })
  }

  if (!parsed.data.fileId && !parsed.data.folderId) {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Provide fileId or folderId" } }, { status: 400 })
  }

  let sharedItemName = ""
  if (parsed.data.fileId) {
    const file = await prisma.file.findFirst({
      where: { id: parsed.data.fileId, userId: session.user.id },
    })
    if (!file) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "File not found" } }, { status: 404 })
    }
    sharedItemName = file.name
  }

  if (parsed.data.folderId) {
    const folder = await prisma.folder.findFirst({
      where: { id: parsed.data.folderId, userId: session.user.id },
    })
    if (!folder) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Folder not found" } }, { status: 404 })
    }
    sharedItemName = folder.name
  }

  const token = generateId().replace(/-/g, "").substring(0, 16)

  const shareLink = await prisma.shareLink.create({
    data: {
      token,
      fileId: parsed.data.fileId || null,
      folderId: parsed.data.folderId || null,
      password: parsed.data.password || null,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      allowDownload: parsed.data.allowDownload,
      userId: session.user.id,
    },
  })

  await logActivity(session.user.id, "share", "share", shareLink.id, { token, name: sharedItemName, hasPassword: !!parsed.data.password }, ctx)

  return NextResponse.json({ shareLink }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 })
  }

  const shareLinks = await prisma.shareLink.findMany({
    where: { userId: session.user.id, isActive: true },
    include: {
      file: { select: { id: true, name: true, type: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ shareLinks })
}
