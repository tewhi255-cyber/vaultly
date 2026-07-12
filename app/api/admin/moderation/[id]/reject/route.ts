import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import prisma from "@/lib/db"
import { deleteFromS3 } from "@/lib/s3"
import { logAdminAction } from "@/lib/audit"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let session: any
  try { session = await requireRole("ADMIN") } catch {
    return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 })
  }

  const { id } = await params
  const file = await prisma.file.findUnique({ where: { id } })
  if (!file) {
    return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 })
  }

  await deleteFromS3(file.storagePath).catch(() => {})
  if (file.thumbnailPath) {
    await deleteFromS3(file.thumbnailPath).catch(() => {})
  }

  await prisma.file.delete({ where: { id } })

  await logAdminAction(session.user.id, "reject_file", "file", id, { name: file.name })

  return NextResponse.json({ success: true })
}
