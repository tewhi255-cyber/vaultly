import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import prisma from "@/lib/db"
import { getRecentActivityFeed } from "@/lib/audit"

export async function GET(req: NextRequest) {
  try {
    await requireRole("ADMIN")
  } catch {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Admin access required" } }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const range = searchParams.get("range") || "30d"
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 365
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const [totalUsers, newUsers, totalFiles, storageAgg, shareLinks, flaggedFiles, topUsers, recentActivity, totalStorageCap] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: since } } }),
      prisma.file.count({ where: { createdAt: { gte: since } } }),
      prisma.file.aggregate({ _sum: { size: true } }),
      prisma.shareLink.count({ where: { isActive: true } }),
      prisma.file.count({ where: { status: "FLAGGED" } }),
      prisma.user.findMany({
        orderBy: { storageUsed: "desc" },
        take: 10,
        select: {
          id: true, name: true, email: true, image: true,
          storageUsed: true, storageQuota: true,
          _count: { select: { files: true } },
        },
      }),
      getRecentActivityFeed(20),
      prisma.user.aggregate({ _sum: { storageQuota: true } }),
    ])

  const typeBreakdown = await prisma.file.groupBy({
    by: ["type"],
    _sum: { size: true },
    _count: true,
  })

  let storageGrowth: any[] = []
  try {
    storageGrowth = await prisma.$queryRaw`
      SELECT DATE_TRUNC('day', "createdAt") as date, SUM("size")::bigint as total
      FROM files
      WHERE "createdAt" >= ${since}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date ASC
    `
  } catch {
    storageGrowth = []
  }

  return NextResponse.json({
    totalUsers,
    newUsers,
    totalFiles,
    totalStorage: Number(storageAgg._sum.size || 0),
    totalStorageCap: Number(totalStorageCap._sum.storageQuota || 0),
    activeShareLinks: shareLinks,
    flaggedFiles,
    typeBreakdown,
    storageGrowth,
    topUsers,
    recentActivity,
  })
}
