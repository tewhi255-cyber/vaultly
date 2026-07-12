import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import prisma from "@/lib/db"
import { updateSettingsSchema } from "@/lib/validations"
import { logAdminAction } from "@/lib/audit"

export async function GET() {
  try { await requireRole("ADMIN") } catch {
    return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 })
  }

  let settings = await prisma.platformSettings.findFirst()
  if (!settings) {
    settings = await prisma.platformSettings.create({ data: {} })
  }

  return NextResponse.json({ settings })
}

export async function PATCH(req: Request) {
  let session: any
  try { session = await requireRole("ADMIN") } catch {
    return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 })
  }

  const body = await req.json()
  const parsed = updateSettingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } }, { status: 400 })
  }

  let settings = await prisma.platformSettings.findFirst()
  if (!settings) {
    settings = await prisma.platformSettings.create({ data: {} })
  }

  const updated = await prisma.platformSettings.update({
    where: { id: settings.id },
    data: parsed.data,
  })

  await logAdminAction(session.user.id, "update_settings", "settings", settings.id, { changes: parsed.data })

  return NextResponse.json({ settings: updated })
}
