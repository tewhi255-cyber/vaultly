"use client"

import { useState, useEffect } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { formatBytes, formatRelativeTime } from "@/lib/utils"
import {
  Users,
  HardDrive,
  FileText,
  Share2,
  AlertTriangle,
  Loader2,
  TrendingUp,
  Crown,
  Activity,
  UserCheck,
} from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts"

const COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6", "#6b7280"]

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState("30d")

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/dashboard/summary?range=${range}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [range])

  if (loading) {
    return (
      <DashboardShell role="ADMIN">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardShell>
    )
  }

  const statCards = [
    { label: "Total Users", value: data?.totalUsers || 0, sub: `+${data?.newUsers || 0} this period`, icon: Users, color: "text-blue-500" },
    { label: "Storage Used", value: formatBytes(data?.totalStorage || 0), sub: `of ${formatBytes(data?.totalStorageCap || 0)}`, icon: HardDrive, color: "text-green-500" },
    { label: "Files Uploaded", value: data?.totalFiles || 0, sub: "This period", icon: FileText, color: "text-yellow-500" },
    { label: "Active Shares", value: data?.activeShareLinks || 0, sub: "Public links", icon: Share2, color: "text-purple-500" },
    { label: "Flagged Files", value: data?.flaggedFiles || 0, sub: "Needs review", icon: AlertTriangle, color: data?.flaggedFiles > 0 ? "text-red-500" : "text-gray-500" },
  ]

  const storageGrowthData = (data?.storageGrowth || []).map((item: any) => ({
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    total: Number(item.total) || 0,
  }))

  const pieData = (data?.typeBreakdown || []).map((item: any) => ({
    name: item.type.charAt(0) + item.type.slice(1).toLowerCase(),
    value: Number(item._sum.size) || 0,
    count: item._count || 0,
  }))

  const storagePercent = data?.totalStorageCap
    ? Math.round((data.totalStorage / data.totalStorageCap) * 100)
    : 0

  return (
    <DashboardShell role="ADMIN">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Admin Overview</h2>
            <p className="text-muted-foreground">Platform-wide statistics and management</p>
          </div>
          <div className="flex gap-1 rounded-lg border p-0.5">
            {["7d", "30d", "all"].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  range === r ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-accent text-muted-foreground"
                }`}
              >
                {r === "all" ? "All Time" : r === "7d" ? "7 Days" : "30 Days"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {statCards.map((card) => (
            <Card key={card.label}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <card.icon className={`h-8 w-8 shrink-0 ${card.color}`} />
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground truncate">{card.label}</p>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <p className="text-xs text-muted-foreground truncate">{card.sub}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Storage Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                {storageGrowthData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={storageGrowthData}>
                      <defs>
                        <linearGradient id="storageGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                      <YAxis tickFormatter={(v) => formatBytes(v)} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                      <Tooltip
                        formatter={(value: number) => formatBytes(value)}
                        contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px" }}
                      />
                      <Area type="monotone" dataKey="total" stroke="#3b82f6" fill="url(#storageGradient)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    No storage data for this period
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-primary" />
                Storage by Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatBytes(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    No files yet
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-2">
                {pieData.map((item: any, i: number) => (
                  <div key={item.name} className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="flex-1">{item.name}</span>
                    <span className="text-muted-foreground">{formatBytes(item.value)}</span>
                    <span className="text-xs text-muted-foreground">({item.count})</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Total capacity used</span>
                  <span className="font-medium">{storagePercent}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(storagePercent, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                Top Users by Storage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.topUsers?.slice(0, 5).map((user: any, i: number) => (
                  <div key={user.id} className="flex items-center gap-3">
                    <span className={`w-6 text-sm font-bold ${i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-orange-400" : "text-muted-foreground"}`}>
                      #{i + 1}
                    </span>
                    <Avatar
                      src={user.image || undefined}
                      alt={user.name || "U"}
                      fallback={user.name?.charAt(0) || "U"}
                      className="h-8 w-8"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name || user.email}</p>
                      <p className="text-xs text-muted-foreground">{user._count?.files || 0} files</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatBytes(user.storageUsed)}</p>
                      <p className="text-xs text-muted-foreground">of {formatBytes(user.storageQuota)}</p>
                    </div>
                  </div>
                ))}
                {(!data?.topUsers || data.topUsers.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No users yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-80 overflow-y-auto">
              <div className="space-y-3">
                {data?.recentActivity?.slice(0, 15).map((activity: any) => (
                  <div key={activity.id} className="flex items-start gap-3 text-sm">
                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                      activity.status === "failed" ? "bg-red-500" : "bg-green-500"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate">
                        <span className="font-medium">{activity.user?.name || "Unknown"}</span>
                        <span className="text-muted-foreground">
                          {" "}{activity.action.replace(/_/g, " ")}{" "}
                          {activity.entityType}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(activity.createdAt)}
                        {activity.ipAddress && ` · ${activity.ipAddress}`}
                      </p>
                    </div>
                    <Badge variant={activity.status === "failed" ? "destructive" : "secondary"} className="text-[10px] px-1">
                      {activity.status}
                    </Badge>
                  </div>
                ))}
                {(!data?.recentActivity || data.recentActivity.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}
