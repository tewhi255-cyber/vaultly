import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import prisma from "@/lib/db"
import { logAdminAction } from "@/lib/audit"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let session: any
  try { session = await requireRole("ADMIN") } catch {
    return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 })
  }

  const { id } = await params
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 })
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { status: "suspended" },
  })

  await logAdminAction(session.user.id, "suspend_user", "user", id)

  return NextResponse.json({ user: updated })
}
