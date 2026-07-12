"use client"

import { useState, useEffect } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatBytes } from "@/lib/utils"
import { HardDrive, Trash2, Loader2, TrendingUp } from "lucide-react"

export default function StoragePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [cleaning, setCleaning] = useState(false)

  useEffect(() => {
    fetch("/api/admin/storage/overview")
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function runCleanup() {
    setCleaning(true)
    const res = await fetch("/api/admin/storage/cleanup", { method: "POST" })
    const result = await res.json()
    alert(`Cleaned up ${result.deleted} files`)
    setCleaning(false)
  }

  if (loading) {
    return (
      <DashboardShell role="ADMIN">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="ADMIN">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Storage Overview</h2>
            <p className="text-muted-foreground">Platform-wide storage management</p>
          </div>
          <Button variant="outline" onClick={runCleanup} disabled={cleaning}>
            <Trash2 className="h-4 w-4 mr-2" />
            {cleaning ? "Cleaning..." : "Run Cleanup"}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Total Storage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatBytes(data?.totalStorage || 0)}</p>
              <p className="text-sm text-muted-foreground">across {data?.totalFiles || 0} files</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Trash
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatBytes(data?.trashSize || 0)}</p>
              <p className="text-sm text-muted-foreground">{data?.trashCount || 0} files awaiting cleanup</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Users by Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.topUsers?.map((user: any, i: number) => (
                <div key={user.id} className="flex items-center gap-3 text-sm">
                  <span className="w-6 text-muted-foreground">#{i + 1}</span>
                  <span className="flex-1">{user.name || user.email}</span>
                  <span className="font-medium">{formatBytes(user.storageUsed)}</span>
                  <span className="text-muted-foreground">/ {formatBytes(user.storageQuota)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
