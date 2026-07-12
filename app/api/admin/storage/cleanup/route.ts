import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import prisma from "@/lib/db"
import { deleteFromS3 } from "@/lib/s3"
import { logAdminAction } from "@/lib/audit"

export async function POST() {
  let session: any
  try { session = await requireRole("ADMIN") } catch {
    return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 })
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const expiredFiles = await prisma.file.findMany({
    where: {
      isTrash: true,
      deletedAt: { lte: thirtyDaysAgo },
    },
  })

  for (const file of expiredFiles) {
    await deleteFromS3(file.storagePath).catch(() => {})
    if (file.thumbnailPath) {
      await deleteFromS3(file.thumbnailPath).catch(() => {})
    }
  }

  const ids = expiredFiles.map((f: any) => f.id)
  const count = ids.length

  if (count > 0) {
    await prisma.file.deleteMany({ where: { id: { in: ids } } })
  }

  await logAdminAction(session.user.id, "storage_cleanup", "system", undefined, { filesDeleted: count })

  return NextResponse.json({ deleted: count })
}
