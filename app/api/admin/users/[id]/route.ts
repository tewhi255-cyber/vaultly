import { NextRequest, NextResponse } from "next/server"
import { auth, requireRole } from "@/lib/auth"
import prisma from "@/lib/db"
import { updateUserSchema } from "@/lib/validations"
import { logAdminAction } from "@/lib/audit"

async function getAdmin() {
  try { return await requireRole("ADMIN") } catch { return null }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdmin()
  if (!session) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Admin access required" } }, { status: 403 })
  }

  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, image: true, role: true, status: true,
      storageUsed: true, storageQuota: true, lastLoginAt: true, lastIp: true, createdAt: true,
      _count: { select: { files: true } },
    },
  })

  if (!user) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "User not found" } }, { status: 404 })
  }

  const typeBreakdown = await prisma.file.groupBy({
    by: ["type"],
    where: { userId: id, isTrash: false },
    _sum: { size: true },
    _count: true,
  })

  const recentFiles = await prisma.file.findMany({
    where: { userId: id, isTrash: false },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, name: true, type: true, size: true, createdAt: true, status: true },
  })

  const activities = await prisma.activity.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  return NextResponse.json({ user, typeBreakdown, recentFiles, activities })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdmin()
  if (!session) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Admin access required" } }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = updateUserSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "User not found" } }, { status: 404 })
  }

  const data: any = {}
  if (parsed.data.name) data.name = parsed.data.name
  if (parsed.data.role) data.role = parsed.data.role
  if (parsed.data.adminRole !== undefined) data.adminRole = parsed.data.adminRole
  if (parsed.data.status) data.status = parsed.data.status
  if (parsed.data.storageQuota) data.storageQuota = parsed.data.storageQuota * 1024 * 1024 * 1024

  if (parsed.data.role && parsed.data.role !== user.role) {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } })
    if (adminCount <= 1 && user.role === "ADMIN") {
      return NextResponse.json({ error: { code: "LAST_ADMIN", message: "Cannot demote the last admin" } }, { status: 403 })
    }
  }

  const updated = await prisma.user.update({ where: { id }, data })

  await logAdminAction(session.user.id, "update_user", "user", id, { changes: parsed.data })

  return NextResponse.json({ user: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdmin()
  if (!session) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Admin access required" } }, { status: 403 })
  }

  const { id } = await params
  if (id === session.user.id) {
    return NextResponse.json({ error: { code: "SELF_DELETE", message: "Cannot delete yourself" } }, { status: 403 })
  }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "User not found" } }, { status: 404 })
  }

  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } })
  if (user.role === "ADMIN" && adminCount <= 1) {
    return NextResponse.json({ error: { code: "LAST_ADMIN", message: "Cannot delete the last admin" } }, { status: 403 })
  }

  await prisma.user.update({ where: { id }, data: { status: "suspended" } })

  await logAdminAction(session.user.id, "delete_user", "user", id, { email: user.email })

  return NextResponse.json({ success: true })
}
