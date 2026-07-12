import { NextRequest, NextResponse } from "next/server"
import { requireAdminRole } from "@/lib/auth"
import prisma from "@/lib/db"
import { logAdminAction, extractLogContext } from "@/lib/audit"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let session: any
  try { session = await requireAdminRole("MODERATOR") } catch {
    return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 })
  }

  const ctx = extractLogContext(req)
  const { id } = await params

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 })
  }

  // In production, send a real password reset email
  // For now, generate a reset token and log it
  const resetToken = crypto.randomUUID().replace(/-/g, "").substring(0, 20)

  await logAdminAction(session.user.id, "reset_password", "user", id, {
    email: user.email,
    method: "email_link",
  }, ctx)

  console.log(`[PASSWORD RESET] Token for ${user.email}: ${resetToken}`)

  return NextResponse.json({
    success: true,
    message: "Password reset email sent",
    // In dev-only, return the token so it can be used for testing
    ...(process.env.NODE_ENV === "development" ? { devResetToken: resetToken } : {}),
  })
}
