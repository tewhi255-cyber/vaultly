import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { updateFolderSchema } from "@/lib/validations"
import { logActivity, extractLogContext } from "@/lib/audit"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 })
  }

  const { id } = await params
  const ctx = extractLogContext(req)
  const body = await req.json()
  const parsed = updateFolderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } }, { status: 400 })
  }

  const folder = await prisma.folder.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!folder) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Folder not found" } }, { status: 404 })
  }

  const updated = await prisma.folder.update({
    where: { id },
    data: parsed.data,
  })

  if (parsed.data.name) {
    await logActivity(session.user.id, "folder_rename", "folder", id, { oldName: folder.name, newName: parsed.data.name }, ctx)
  }

  return NextResponse.json({ folder: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 })
  }

  const { id } = await params
  const ctx = extractLogContext(req)
  const folder = await prisma.folder.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!folder) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Folder not found" } }, { status: 404 })
  }

  await prisma.folder.update({
    where: { id },
    data: { isTrash: true, deletedAt: new Date() },
  })

  await prisma.file.updateMany({
    where: { folderId: id },
    data: { isTrash: true, deletedAt: new Date() },
  })

  await logActivity(session.user.id, "folder_delete", "folder", id, { name: folder.name }, ctx)

  return NextResponse.json({ success: true })
}
