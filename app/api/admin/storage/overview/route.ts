import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import prisma from "@/lib/db"

export async function GET() {
  try {
    await requireRole("ADMIN")
  } catch {
    return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 })
  }

  const [totalStats, typeBreakdown, topUsers, trashCount, trashSize] = await Promise.all([
    prisma.file.aggregate({ _sum: { size: true }, _count: true }),
    prisma.file.groupBy({
      by: ["type"],
      _sum: { size: true },
      _count: true,
    }),
    prisma.user.findMany({
      orderBy: { storageUsed: "desc" },
      take: 10,
      select: {
        id: true, name: true, email: true, storageUsed: true, storageQuota: true,
        _count: { select: { files: true } },
      },
    }),
    prisma.file.count({ where: { isTrash: true } }),
    prisma.file.aggregate({ where: { isTrash: true }, _sum: { size: true } }),
  ])

  return NextResponse.json({
    totalFiles: totalStats._count,
    totalStorage: Number(totalStats._sum.size || 0),
    typeBreakdown,
    topUsers,
    trashCount,
    trashSize: Number(trashSize._sum.size || 0),
  })
}
