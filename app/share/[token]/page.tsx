"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Cloud, Download, Lock, FileIcon, Calendar, Eye } from "lucide-react"
import { formatBytes, formatDate } from "@/lib/utils"

export default function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const [share, setShare] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [token, setToken] = useState("")
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  useEffect(() => {
    params.then((p) => {
      setToken(p.token)
      loadShare(p.token)
    })
  }, [])

  async function loadShare(t: string) {
    setLoading(true)
    const res = await fetch(`/api/share/${t}`)
    if (res.status === 401) {
      setShare({ needsPassword: true })
      setLoading(false)
      return
    }
    if (res.ok) {
      const data = await res.json()
      setShare(data.share)
      setDownloadUrl(data.downloadUrl)
    }
    setLoading(false)
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError("")
    const res = await fetch(`/api/share/${token}?password=${encodeURIComponent(password)}`)
    if (res.status === 403) {
      setPasswordError("Invalid password")
      return
    }
    if (res.ok) {
      const data = await res.json()
      setShare(data.share)
      setDownloadUrl(data.downloadUrl)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Cloud className="h-8 w-8 animate-pulse text-muted-foreground" />
      </div>
    )
  }

  if (share?.needsPassword) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <Lock className="h-8 w-8" />
            </div>
            <CardTitle>Password Required</CardTitle>
            <CardDescription>This file is password-protected</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
              <Button type="submit" className="w-full">View File</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!share) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Share link not found or has expired</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Cloud className="h-8 w-8" />
          </div>
          <CardTitle>Vaultly Shared File</CardTitle>
          <CardDescription>You've been shared a file</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center gap-3">
              <FileIcon className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">{share.file?.name || "Shared File"}</p>
                <p className="text-sm text-muted-foreground">
                  {share.file ? formatBytes(share.file.size) : "Unknown size"}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(share.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {share.viewCount} views
              </span>
            </div>
          </div>
          {downloadUrl && share.allowDownload && (
            <Button className="w-full" asChild>
              <a href={downloadUrl} download>
                <Download className="h-4 w-4 mr-2" />
                Download File
              </a>
            </Button>
          )}
          {!share.allowDownload && (
            <p className="text-center text-sm text-muted-foreground">Download is disabled for this share</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
