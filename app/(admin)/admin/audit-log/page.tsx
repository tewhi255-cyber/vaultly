"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { formatDate, formatRelativeTime } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, FileText, Search, Download, AlertTriangle, Filter, ChevronLeft, ChevronRight } from "lucide-react"

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [daysFilter, setDaysFilter] = useState("30")
  const [cursor, setCursor] = useState<string | null>(null)
  const [suspicious, setSuspicious] = useState<any>(null)
  const [showSuspicious, setShowSuspicious] = useState(false)

  const loadLogs = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (actionFilter) params.set("action", actionFilter)
    if (statusFilter) params.set("status", statusFilter)
    if (daysFilter) params.set("days", daysFilter)
    if (cursor) params.set("cursor", cursor)
    params.set("limit", "50")

    const res = await fetch(`/api/admin/audit-log?${params}`)
    const data = await res.json()
    setLogs(data.logs || [])
    setLoading(false)
  }, [actionFilter, statusFilter, daysFilter, cursor])

  useEffect(() => { loadLogs() }, [loadLogs])

  useEffect(() => {
    fetch("/api/admin/suspicious?days=7")
      .then((r) => r.json())
      .then(setSuspicious)
      .catch(() => {})
  }, [])

  function exportCSV() {
    const params = new URLSearchParams()
    if (actionFilter) params.set("action", actionFilter)
    if (statusFilter) params.set("status", statusFilter)
    if (daysFilter) params.set("days", daysFilter)
    window.open(`/api/admin/audit-log/export?${params}`, "_blank")
  }

  const hasFailedLogins = suspicious?.multipleFailedLogins?.length > 0
  const suspiciousIps: string[] = [
    ...new Set<string>((suspicious?.multipleFailedLogins || []).map((l: any) => l.ipAddress as string)),
  ]

  return (
    <DashboardShell role="ADMIN">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Activity Logs</h2>
            <p className="text-muted-foreground">Track all user actions across the platform</p>
          </div>
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {hasFailedLogins && (
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2 text-red-500">
                <AlertTriangle className="h-4 w-4" />
                Suspicious Activity Detected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  {suspicious.multipleFailedLogins.length} IPs with 3+ failed login attempts in the last 7 days:
                </p>
                <div className="flex flex-wrap gap-2">
                  {suspiciousIps.map((ip: string) => (
                    <Badge key={ip} variant="destructive" className="font-mono">
                      {ip}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by action type..."
              className="pl-8"
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setCursor(null) }}
            />
          </div>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCursor(null) }}
          >
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none"
            value={daysFilter}
            onChange={(e) => { setDaysFilter(e.target.value); setCursor(null) }}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No log entries found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50 text-sm text-muted-foreground">
                  <th className="text-left p-3 font-medium">Timestamp</th>
                  <th className="text-left p-3 font-medium">User</th>
                  <th className="text-left p-3 font-medium">Action</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Status</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Resource</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">IP / Device</th>
                  <th className="text-left p-3 font-medium hidden xl:table-cell">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => {
                  const isSuspiciousIp = suspiciousIps.includes(log.ipAddress)
                  return (
                    <tr
                      key={log.id}
                      className={`border-b hover:bg-accent/50 text-sm ${
                        log.status === "failed" ? "bg-red-50/30 dark:bg-red-950/10" : ""
                      } ${isSuspiciousIp ? "bg-yellow-50/30 dark:bg-yellow-950/10" : ""}`}
                    >
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {formatRelativeTime(log.createdAt)}
                        <div className="text-xs">{formatDate(log.createdAt)}</div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{log.user?.name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{log.user?.email || ""}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="capitalize">{log.action.replace(/_/g, " ")}</span>
                      </td>
                      <td className="p-3 hidden sm:table-cell">
                        <Badge
                          variant={log.status === "failed" ? "destructive" : "success"}
                          className="text-[10px] px-1.5"
                        >
                          {log.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground hidden md:table-cell capitalize">
                        {log.entityType}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground hidden lg:table-cell">
                        <div className="flex items-center gap-1">
                          {isSuspiciousIp && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
                          <span className="font-mono">{log.ipAddress || "-"}</span>
                        </div>
                        {log.deviceInfo && <div>{log.deviceInfo}</div>}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground hidden xl:table-cell max-w-[150px] truncate">
                        {log.metadata ? JSON.stringify(log.metadata).substring(0, 50) : "-"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{logs.length} entries shown</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!cursor} onClick={() => setCursor(null)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => { if (logs.length > 0) setCursor(logs[logs.length - 1].id) }}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
