import { NextRequest, NextResponse } from "next/server"
import { requireAdminRole } from "@/lib/auth"
import prisma from "@/lib/db"
import { logAdminAction, extractLogContext } from "@/lib/audit"
import { generateId } from "@/lib/utils"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let session: any
  try { session = await requireAdminRole("SUPER_ADMIN") } catch {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Super admin access required" } }, { status: 403 })
  }

  const ctx = extractLogContext(req)
  const { id } = await params

  const targetUser = await prisma.user.findUnique({ where: { id } })
  if (!targetUser) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "User not found" } }, { status: 404 })
  }

  if (targetUser.role === "ADMIN") {
    return NextResponse.json({ error: { code: "CANNOT_IMPERSONATE", message: "Cannot impersonate another admin" } }, { status: 403 })
  }

  const token = generateId() + "-" + generateId()
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

  const impersonation = await prisma.impersonationSession.create({
    data: {
      adminId: session.user.id,
      targetUserId: id,
      token,
      expiresAt,
    },
  })

  await logAdminAction(session.user.id, "impersonate", "user", id, {
    targetEmail: targetUser.email,
    targetName: targetUser.name,
  }, ctx)

  return NextResponse.json({
    token: impersonation.token,
    expiresAt: impersonation.expiresAt,
    user: {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      image: targetUser.image,
    },
  })
}
