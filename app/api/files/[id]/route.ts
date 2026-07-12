import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { deleteFromS3, getSignedDownloadUrl } from "@/lib/s3"
import { renameFileSchema, moveFileSchema } from "@/lib/validations"
import { logActivity, extractLogContext } from "@/lib/audit"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 })
  }

  const { id } = await params
  const ctx = extractLogContext(req)
  const file = await prisma.file.findFirst({
    where: { id, userId: session.user.id },
    include: { folder: { select: { id: true, name: true } } },
  })

  if (!file) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "File not found" } }, { status: 404 })
  }

  const downloadUrl = await getSignedDownloadUrl(file.storagePath)

  await logActivity(session.user.id, "download", "file", id, { name: file.name, size: Number(file.size) }, ctx)

  return NextResponse.json({ file, downloadUrl })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 })
  }

  const { id } = await params
  const ctx = extractLogContext(req)
  const body = await req.json()
  const file = await prisma.file.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!file) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "File not found" } }, { status: 404 })
  }

  const renameResult = renameFileSchema.safeParse(body)
  const moveResult = moveFileSchema.safeParse(body)

  if (renameResult.success && renameResult.data.name) {
    const updated = await prisma.file.update({
      where: { id },
      data: { name: renameResult.data.name },
    })
    await logActivity(session.user.id, "rename", "file", id, { oldName: file.name, newName: renameResult.data.name }, ctx)
    return NextResponse.json({ file: updated })
  }

  if (moveResult.success) {
    const updated = await prisma.file.update({
      where: { id },
      data: { folderId: moveResult.data.folderId },
    })
    await logActivity(session.user.id, "move", "file", id, { fromFolder: file.folderId, toFolder: moveResult.data.folderId }, ctx)
    return NextResponse.json({ file: updated })
  }

  return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Provide name or folderId" } }, { status: 400 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 })
  }

  const { id } = await params
  const ctx = extractLogContext(req)
  const file = await prisma.file.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!file) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "File not found" } }, { status: 404 })
  }

  const updated = await prisma.file.update({
    where: { id },
    data: { isTrash: true, deletedAt: new Date() },
  })

  await logActivity(session.user.id, "delete", "file", id, { name: file.name, size: Number(file.size) }, ctx)

  return NextResponse.json({ file: updated })
}
