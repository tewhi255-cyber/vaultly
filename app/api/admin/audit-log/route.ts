import { NextRequest, NextResponse } from "next/server"
import { requireAdminRole } from "@/lib/auth"
import prisma from "@/lib/db"

export async function GET(req: NextRequest) {
  try { await requireAdminRole("MODERATOR") } catch {
    return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action")
  const status = searchParams.get("status")
  const cursor = searchParams.get("cursor")
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)
  const days = parseInt(searchParams.get("days") || "30")

  const where: any = {
    createdAt: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
  }
  if (action) where.action = action
  if (status) where.status = status

  const logs = await prisma.activity.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  })

  const hasMore = logs.length > limit
  const items = hasMore ? logs.slice(0, limit) : logs
  const nextCursor = hasMore ? items[items.length - 1].id : null

  return NextResponse.json({ logs: items, nextCursor })
}
