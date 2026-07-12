import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")
  const sort = searchParams.get("sort") || "createdAt"
  const order = searchParams.get("order") || "desc"
  const search = searchParams.get("search")
  const folderId = searchParams.get("folderId")
  const cursor = searchParams.get("cursor")
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)

  const where: any = {
    userId: session.user.id,
    isTrash: false,
  }

  if (type && type !== "ALL") {
    where.type = type
  }

  if (folderId !== undefined) {
    where.folderId = folderId === "null" ? null : folderId
  }

  if (search) {
    where.name = { contains: search, mode: "insensitive" }
  }

  const orderBy: any = {}
  orderBy[sort] = order

  const files = await prisma.file.findMany({
    where,
    orderBy,
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: { folder: { select: { id: true, name: true } } },
  })

  const hasMore = files.length > limit
  const items = hasMore ? files.slice(0, limit) : files
  const nextCursor = hasMore ? items[items.length - 1].id : null

  return NextResponse.json({ files: items, nextCursor })
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ error: { code: "METHOD_NOT_ALLOWED", message: "Use /api/upload for file uploads" } }, { status: 405 })
}
