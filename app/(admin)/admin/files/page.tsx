"use client"

import { useState, useEffect } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { formatBytes, formatDate } from "@/lib/utils"
import { Search, FileText, Loader2, Trash2 } from "lucide-react"

export default function AdminFilesPage() {
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("")

  useEffect(() => {
    loadFiles()
  }, [search, typeFilter])

  async function loadFiles() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (typeFilter) params.set("type", typeFilter)
    params.set("limit", "50")

    const res = await fetch(`/api/admin/files?${params}`)
    const data = await res.json()
    setFiles(data.files || [])
    setLoading(false)
  }

  async function deleteFile(id: string) {
    if (!confirm("Delete this file permanently?")) return
    await fetch(`/api/admin/files/${id}`, { method: "DELETE" })
    loadFiles()
  }

  return (
    <DashboardShell role="ADMIN">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">All Files</h2>
          <p className="text-muted-foreground">Browse and manage all files on the platform</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="IMAGE">Images</option>
            <option value="VIDEO">Videos</option>
            <option value="DOCUMENT">Documents</option>
            <option value="AUDIO">Audio</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="border rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b text-sm text-muted-foreground">
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Owner</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Type</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Size</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Status</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Uploaded</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file: any) => (
                  <tr key={file.id} className="border-b hover:bg-accent/50">
                    <td className="p-3 text-sm">{file.name}</td>
                    <td className="p-3 text-sm hidden sm:table-cell">{file.user?.name || file.user?.email}</td>
                    <td className="p-3 text-sm hidden md:table-cell capitalize">{file.type.toLowerCase()}</td>
                    <td className="p-3 text-sm hidden md:table-cell">{formatBytes(file.size)}</td>
                    <td className="p-3 hidden lg:table-cell">
                      <Badge variant={file.status === "READY" ? "success" : file.status === "FLAGGED" ? "destructive" : "secondary"}>
                        {file.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm hidden lg:table-cell">{formatDate(file.createdAt)}</td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => deleteFile(file.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
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
