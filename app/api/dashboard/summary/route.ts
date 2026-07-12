import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 })
  }

  const userId = session.user.id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { storageUsed: true, storageQuota: true },
  })

  const [filesCount, foldersCount, shareLinksCount, typeBreakdown, recentFiles, recentActivity] =
    await Promise.all([
      prisma.file.count({ where: { userId, isTrash: false } }),
      prisma.folder.count({ where: { userId, isTrash: false } }),
      prisma.shareLink.count({ where: { userId, isActive: true } }),
      prisma.file.groupBy({
        by: ["type"],
        where: { userId, isTrash: false },
        _sum: { size: true },
        _count: true,
      }),
      prisma.file.findMany({
        where: { userId, isTrash: false },
        orderBy: { updatedAt: "desc" },
        take: 10,
        select: { id: true, name: true, type: true, thumbnailPath: true, updatedAt: true, size: true },
      }),
      prisma.activity.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ])

  return NextResponse.json({
    storageUsed: Number(user?.storageUsed || 0),
    storageQuota: Number(user?.storageQuota || 0),
    filesCount,
    foldersCount,
    shareLinksCount,
    typeBreakdown,
    recentFiles,
    recentActivity,
  })
}
