import { NextRequest, NextResponse } from "next/server"
import { requireAdminRole } from "@/lib/auth"
import prisma from "@/lib/db"

export async function GET(req: NextRequest) {
  try { await requireAdminRole("MODERATOR") } catch {
    return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get("days") || "30")
  const action = searchParams.get("action")
  const status = searchParams.get("status")

  const where: any = {
    createdAt: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
  }
  if (action) where.action = action
  if (status) where.status = status

  const logs = await prisma.activity.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10000,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  })

  const header = "Timestamp,User,Email,Action,Status,Resource Type,IP Address,Device,Details\n"
  const rows = logs.map((log: any) => {
    const meta = log.metadata ? JSON.stringify(log.metadata).replace(/"/g, '""') : ""
    return [
      log.createdAt.toISOString(),
      `"${log.user?.name || "Unknown"}"`,
      `"${log.user?.email || ""}"`,
      log.action,
      log.status,
      log.entityType,
      log.ipAddress || "",
      log.deviceInfo || "",
      `"${meta}"`,
    ].join(",")
  })

  const csv = "\uFEFF" + header + rows.join("\n")

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="activity-logs-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  })
}
