import { NextRequest, NextResponse } from "next/server"
import { requireAdminRole } from "@/lib/auth"
import { getSuspiciousActivities } from "@/lib/audit"

export async function GET(req: NextRequest) {
  try { await requireAdminRole("MODERATOR") } catch {
    return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 })
  }

  const days = parseInt(req.nextUrl.searchParams.get("days") || "7")
  const result = await getSuspiciousActivities(days)

  return NextResponse.json(result)
}
