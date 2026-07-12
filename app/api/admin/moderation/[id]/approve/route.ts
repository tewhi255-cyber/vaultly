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
  const updated = await prisma.file.update({
    where: { id },
    data: { status: "READY" },
  })

  await logAdminAction(session.user.id, "approve_file", "file", id)

  return NextResponse.json({ file: updated })
}
