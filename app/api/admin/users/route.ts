import { NextRequest, NextResponse } from "next/server"
import { auth, requireRole } from "@/lib/auth"
import prisma from "@/lib/db"
import { hash } from "bcryptjs"
import { signupSchema } from "@/lib/validations"
import { logAdminAction } from "@/lib/audit"

export async function GET(req: NextRequest) {
  let session: any
  try { session = await requireRole("ADMIN") } catch {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Admin access required" } }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search")
  const role = searchParams.get("role")
  const status = searchParams.get("status")
  const sort = searchParams.get("sort") || "createdAt"
  const order = searchParams.get("order") || "desc"
  const cursor = searchParams.get("cursor")
  const limit = Math.min(parseInt(searchParams.get("limit") || "25"), 100)

  const where: any = {}
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ]
  }
  if (role) where.role = role
  if (status) where.status = status

  const orderBy: any = {}
  orderBy[sort] = order

  const users = await prisma.user.findMany({
    where,
    orderBy,
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      adminRole: true,
      status: true,
      storageUsed: true,
      storageQuota: true,
      lastLoginAt: true,
      createdAt: true,
      _count: { select: { files: true } },
    },
  })

  const hasMore = users.length > limit
  const items = hasMore ? users.slice(0, limit) : users
  const nextCursor = hasMore ? items[items.length - 1].id : null
  const total = await prisma.user.count({ where })

  return NextResponse.json({ users: items, nextCursor, total })
}

export async function POST(req: NextRequest) {
  let session: any
  try { session = await requireRole("ADMIN") } catch {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Admin access required" } }, { status: 403 })
  }

  const body = await req.json()
  const parsed = signupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (existing) {
    return NextResponse.json({ error: { code: "EMAIL_EXISTS", message: "Email already in use" } }, { status: 409 })
  }

  const passwordHash = await hash(parsed.data.password, 12)
  const quotaGb = parseInt(process.env.DEFAULT_STORAGE_QUOTA_GB || "5", 10)

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      storageQuota: quotaGb * 1024 * 1024 * 1024,
      role: body.role || "USER",
    },
  })

  await logAdminAction(session.user.id, "create_user", "user", user.id, { email: user.email })

  return NextResponse.json({ user }, { status: 201 })
}
