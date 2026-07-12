"use client"

import { useState, useEffect } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatBytes, formatDate } from "@/lib/utils"
import { Loader2, Shield, Check, X } from "lucide-react"

export default function ModerationPage() {
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/moderation")
      .then((r) => r.json())
      .then((d) => {
        setFiles(d.files || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleAction(id: string, action: "approve" | "reject") {
    await fetch(`/api/admin/moderation/${id}/${action}`, { method: "POST" })
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  return (
    <DashboardShell role="ADMIN">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Moderation Queue</h2>
          <p className="text-muted-foreground">Review flagged files and content</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Queue is clear</h3>
            <p className="text-sm text-muted-foreground">No files pending review</p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b text-sm text-muted-foreground">
                  <th className="text-left p-3 font-medium">File</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Owner</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Size</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Uploaded</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file: any) => (
                  <tr key={file.id} className="border-b hover:bg-accent/50">
                    <td className="p-3">
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <Badge variant="destructive" className="mt-1">Flagged</Badge>
                      </div>
                    </td>
                    <td className="p-3 text-sm hidden sm:table-cell">{file.user?.name || file.user?.email}</td>
                    <td className="p-3 text-sm hidden md:table-cell">{formatBytes(file.size)}</td>
                    <td className="p-3 text-sm hidden md:table-cell">{formatDate(file.createdAt)}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="outline" size="sm" onClick={() => handleAction(file.id, "approve")}>
                          <Check className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleAction(file.id, "reject")}>
                          <X className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
