import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import prisma from "@/lib/db"
import { logAdminAction } from "@/lib/audit"

export async function GET(req: NextRequest) {
  let session: any
  try { session = await requireRole("ADMIN") } catch {
    return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")
  const status = searchParams.get("status")
  const search = searchParams.get("search")
  const cursor = searchParams.get("cursor")
  const limit = Math.min(parseInt(searchParams.get("limit") || "25"), 100)

  const where: any = {}
  if (type && type !== "ALL") where.type = type
  if (status) where.status = status
  if (search) {
    where.name = { contains: search, mode: "insensitive" }
  }

  const files = await prisma.file.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  const hasMore = files.length > limit
  const items = hasMore ? files.slice(0, limit) : files
  const nextCursor = hasMore ? items[items.length - 1].id : null

  return NextResponse.json({ files: items, nextCursor })
}
