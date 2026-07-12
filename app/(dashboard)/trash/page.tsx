"use client"

import { useState, useEffect } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Trash2, RotateCcw, AlertTriangle, Loader2 } from "lucide-react"
import { formatBytes, formatDate } from "@/lib/utils"

export default function TrashPage() {
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/files?folderId=trash")
      .then((r) => r.json())
      .then((d) => {
        setFiles(d.files || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function restoreFile(id: string) {
    const res = await fetch(`/api/files/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isTrash: false }),
    })
    if (res.ok) {
      setFiles((prev) => prev.filter((f) => f.id !== id))
    }
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Trash</h2>
            <p className="text-muted-foreground">Files are automatically deleted after 30 days</p>
          </div>
          <Button variant="outline" className="text-destructive gap-2">
            <Trash2 className="h-4 w-4" />
            Empty Trash
          </Button>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4" />
          Files in trash are automatically deleted after 30 days
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Trash2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Trash is empty</h3>
            <p className="text-sm text-muted-foreground">Deleted files will appear here</p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b text-sm text-muted-foreground">
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Size</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Deleted</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file: any) => (
                  <tr key={file.id} className="border-b hover:bg-accent/50">
                    <td className="p-3 text-sm">{file.name}</td>
                    <td className="p-3 text-sm hidden sm:table-cell">{formatBytes(file.size)}</td>
                    <td className="p-3 text-sm hidden md:table-cell">
                      {file.deletedAt ? formatDate(file.deletedAt) : "-"}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => restoreFile(file.id)}>
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Restore
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-3 w-3 text-destructive" />
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
