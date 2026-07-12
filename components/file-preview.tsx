"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Download, ChevronLeft, ChevronRight, FileIcon, Loader2, AlertCircle } from "lucide-react"
import { formatBytes, formatDate } from "@/lib/utils"

interface PreviewFile {
  id: string
  name: string
  type: string
  extension: string
  mimeType: string
  size: number
  createdAt: string
  thumbnailPath?: string | null
  downloadUrl?: string
}

interface FilePreviewProps {
  file: PreviewFile | null
  files?: PreviewFile[]
  onClose: () => void
  onNavigate?: (file: PreviewFile) => void
  onDelete?: (id: string) => void
}

export function FilePreview({ file, files = [], onClose, onNavigate, onDelete }: FilePreviewProps) {
  const [loading, setLoading] = useState(true)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const currentIndex = file ? files.findIndex((f) => f.id === file.id) : -1
  const prevFile = currentIndex > 0 ? files[currentIndex - 1] : null
  const nextFile = currentIndex < files.length - 1 ? files[currentIndex + 1] : null

  const loadFile = useCallback(async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/files/${file.id}`)
      if (!res.ok) { setError("Failed to load file"); setLoading(false); return }
      const data = await res.json()
      setDownloadUrl(data.downloadUrl)
    } catch {
      setError("Network error")
    }
    setLoading(false)
  }, [file?.id])

  useEffect(() => { loadFile() }, [loadFile])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft" && prevFile && onNavigate) onNavigate(prevFile)
      if (e.key === "ArrowRight" && nextFile && onNavigate) onNavigate(nextFile)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [prevFile, nextFile, onNavigate, onClose])

  if (!file) return null

  const isImage = file.mimeType?.startsWith("image/")
  const isVideo = file.mimeType?.startsWith("video/")
  const isPdf = file.mimeType === "application/pdf"

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/90">
      <header className="flex items-center justify-between px-4 py-3 bg-background/10 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm font-medium truncate">{file.name}</p>
          </div>
          <Badge variant="outline" className="text-[10px] shrink-0">{file.extension}</Badge>
          <span className="text-xs text-muted-foreground hidden sm:inline">{formatBytes(file.size)}</span>
        </div>
        <div className="flex items-center gap-1">
          {currentIndex >= 0 && files.length > 1 && (
            <span className="text-xs text-muted-foreground mr-2 hidden sm:inline">
              {currentIndex + 1} / {files.length}
            </span>
          )}
          {prevFile && onNavigate && (
            <Button variant="ghost" size="icon" onClick={() => onNavigate(prevFile)} className="text-white">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          {nextFile && onNavigate && (
            <Button variant="ghost" size="icon" onClick={() => onNavigate(nextFile)} className="text-white">
              <ChevronRight className="h-5 w-5" />
            </Button>
          )}
          {downloadUrl && (
            <Button variant="ghost" size="icon" asChild className="text-white">
              <a href={downloadUrl} download><Download className="h-4 w-4" /></a>
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-white/60" />
            <p className="text-sm text-white/40">Loading file...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-white/60">{error}</p>
            <Button variant="outline" size="sm" onClick={loadFile}>Retry</Button>
          </div>
        ) : isImage ? (
          <img
            src={downloadUrl || undefined}
            alt={file.name}
            className="max-h-full max-w-full object-contain rounded-lg"
          />
        ) : isVideo ? (
          <video controls autoPlay className="max-h-full max-w-full rounded-lg" key={file.id}>
            <source src={downloadUrl || undefined} type={file.mimeType} />
          </video>
        ) : isPdf ? (
          <iframe
            src={downloadUrl || undefined}
            className="h-full w-full rounded-lg border-0"
            title={file.name}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-white/60">
            <FileIcon className="h-16 w-16" />
            <p className="text-sm">Preview not available for this file type</p>
            {downloadUrl && (
              <Button asChild>
                <a href={downloadUrl} download><Download className="h-4 w-4 mr-2" />Download</a>
              </Button>
            )}
          </div>
        )}
      </div>

      <footer className="flex items-center justify-between px-4 py-2 bg-background/10 backdrop-blur-sm text-xs text-white/40">
        <span>{formatDate(file.createdAt)}</span>
        <span className="capitalize">{file.type.toLowerCase()}</span>
      </footer>
    </div>
  )
}
