import prisma from "./db"
import { NextRequest } from "next/server"

export interface LogContext {
  ipAddress?: string
  userAgent?: string
  deviceInfo?: string
}

export function extractLogContext(req?: NextRequest | Request): LogContext {
  if (!req) return {}
  const headers = req.headers as Headers
  const ipAddress =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  const userAgent = headers.get("user-agent") || undefined
  const deviceInfo = userAgent ? parseUserAgent(userAgent) : undefined
  return { ipAddress, userAgent, deviceInfo }
}

function parseUserAgent(ua: string): string {
  if (ua.includes("Mobile")) return "mobile"
  if (ua.includes("Tablet")) return "tablet"
  if (ua.includes("Mac")) return "desktop-mac"
  if (ua.includes("Windows")) return "desktop-windows"
  if (ua.includes("Linux")) return "desktop-linux"
  return "unknown"
}

export async function logActivity(
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  metadata?: Record<string, unknown>,
  context?: LogContext
) {
  return prisma.activity.create({
    data: {
      userId,
      action,
      status: "success",
      entityType,
      entityId,
      metadata: metadata || {},
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      deviceInfo: context?.deviceInfo,
    },
  })
}

export async function logFailedActivity(
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  metadata?: Record<string, unknown>,
  context?: LogContext
) {
  return prisma.activity.create({
    data: {
      userId,
      action,
      status: "failed",
      entityType,
      entityId,
      metadata: metadata || {},
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      deviceInfo: context?.deviceInfo,
    },
  })
}

export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId?: string,
  metadata?: Record<string, unknown>,
  context?: LogContext
) {
  return prisma.auditLog.create({
    data: {
      adminId,
      action,
      targetType,
      targetId,
      metadata: metadata || {},
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    },
  })
}

export async function logFailedLogin(
  email: string,
  reason: string,
  context?: LogContext,
  userId?: string
) {
  return prisma.failedLogin.create({
    data: {
      email,
      reason,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      userId,
    },
  })
}

export async function getSuspiciousActivities(days: number = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const [multipleFailedLogins, newLocationLogins] = await Promise.all([
    prisma.failedLogin.groupBy({
      by: ["email", "ipAddress"],
      where: { createdAt: { gte: since } },
      _count: true,
      having: { ipAddress: { _count: { gte: 3 } } },
    }),
    prisma.activity.findMany({
      where: {
        action: "login",
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ])

  return {
    multipleFailedLogins,
    recentLogins: newLocationLogins,
  }
}

export async function getRecentActivityFeed(limit: number = 20): Promise<any[]> {
  return prisma.activity.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  })
}
