"use client"

import { useState, useEffect } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatRelativeTime } from "@/lib/utils"
import { FileRowSkeleton } from "@/components/skeleton"
import { Share2, Link2, Copy, Trash2, Loader2, Plus } from "lucide-react"

export default function SharedPage() {
  const [links, setLinks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/share")
      .then((r) => r.json())
      .then((d) => { setLinks(d.shareLinks || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function copyLink(token: string) {
    const url = `${window.location.origin}/share/${token}`
    await navigator.clipboard.writeText(url)
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Shared Links</h2>
            <p className="text-muted-foreground">Manage your publicly shared files</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            New Share Link
          </Button>
        </div>

        {loading ? (
          <div className="border rounded-lg">
            {Array.from({ length: 4 }).map((_, i) => <FileRowSkeleton key={i} />)}
          </div>
        ) : links.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <Link2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No shared links</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Share files with others by creating a public link
            </p>
            <Button variant="outline">Create a Share Link</Button>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b text-sm text-muted-foreground">
                  <th className="text-left p-3 font-medium">File</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Created</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Expires</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Views</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link: any) => (
                  <tr key={link.id} className="border-b hover:bg-accent/50">
                    <td className="p-3 flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="text-sm font-medium truncate">{link.file?.name || "Folder"}</span>
                    </td>
                    <td className="p-3 text-sm hidden md:table-cell">{formatDate(link.createdAt)}</td>
                    <td className="p-3 text-sm hidden md:table-cell">
                      {link.expiresAt ? formatDate(link.expiresAt) : "Never"}
                    </td>
                    <td className="p-3 text-sm hidden sm:table-cell">{link.viewCount}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => copyLink(link.token)}>
                          <Copy className="h-3 w-3" />
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
