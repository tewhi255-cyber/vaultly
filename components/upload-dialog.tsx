"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, X, FileIcon, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { cn, formatBytes } from "@/lib/utils"

interface UploadFile {
  id: string
  file: File
  progress: number
  status: "pending" | "uploading" | "done" | "error"
  error?: string
  preview?: string
}

interface UploadDialogProps {
  open: boolean
  onClose: () => void
  folderId?: string | null
  onComplete: () => void
}

export function UploadDialog({ open, onClose, folderId, onComplete }: UploadDialogProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const newFiles = Array.from(fileList).map((file) => {
      const id = Math.random().toString(36).substring(2, 11)
      const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined
      return { id, file, progress: 0, status: "pending" as const, preview }
    })
    setFiles((prev) => [...prev, ...newFiles])
    newFiles.forEach(uploadFile)
  }, [])

  async function uploadFile(uploadItem: UploadFile) {
    setFiles((prev) => prev.map((f) => (f.id === uploadItem.id ? { ...f, status: "uploading" } : f)))

    const formData = new FormData()
    formData.append("file", uploadItem.file)
    if (folderId) formData.append("folderId", folderId)

    const xhr = new XMLHttpRequest()

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 100)
        setFiles((prev) => prev.map((f) => (f.id === uploadItem.id ? { ...f, progress } : f)))
      }
    }

    return new Promise<void>((resolve) => {
      xhr.onload = () => {
        if (xhr.status === 201) {
          setFiles((prev) => prev.map((f) => (f.id === uploadItem.id ? { ...f, status: "done", progress: 100 } : f)))
        } else {
          let error = "Upload failed"
          try { const r = JSON.parse(xhr.responseText); error = r.error?.message || error } catch {}
          setFiles((prev) => prev.map((f) => (f.id === uploadItem.id ? { ...f, status: "error", error } : f)))
        }
        resolve()
      }
      xhr.onerror = () => {
        setFiles((prev) => prev.map((f) => (f.id === uploadItem.id ? { ...f, status: "error", error: "Network error" } : f)))
        resolve()
      }
      xhr.open("POST", "/api/upload")
      xhr.send(formData)
    })
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files)
    }
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  function handleClose() {
    const allDone = files.every((f) => f.status === "done")
    if (allDone) onComplete()
    setFiles([])
    onClose()
  }

  if (!open) return null

  const allDone = files.length > 0 && files.every((f) => f.status === "done")
  const hasErrors = files.some((f) => f.status === "error")
  const isUploading = files.some((f) => f.status === "uploading")

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative z-[61] w-full max-w-lg rounded-xl border bg-card p-6 shadow-lg mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Upload Files</h3>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
          )}
        >
          <Upload className={cn("h-8 w-8 mx-auto mb-2", isDragging ? "text-primary" : "text-muted-foreground")} />
          <p className="text-sm font-medium">
            {isDragging ? "Drop files here" : "Drag & drop files or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Supports images, videos, documents, and more</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
        </div>

        {files.length > 0 && (
          <div className="flex-1 overflow-y-auto mt-4 space-y-2 min-h-0">
            {files.map((item) => (
              <Card key={item.id} className={cn(
                "relative overflow-hidden",
                item.status === "error" && "border-destructive/50",
                item.status === "done" && "border-green-500/50"
              )}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {item.preview ? (
                      <img src={item.preview} alt="" className="h-10 w-10 rounded object-cover shrink-0" />
                    ) : (
                      <FileIcon className="h-10 w-10 text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(item.file.size)}</p>
                      {item.status === "uploading" && (
                        <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${item.progress}%` }} />
                        </div>
                      )}
                      {item.status === "error" && (
                        <p className="text-xs text-destructive mt-0.5">{item.error}</p>
                      )}
                    </div>
                    <div className="shrink-0">
                      {item.status === "pending" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                      {item.status === "uploading" && (
                        <span className="text-xs font-medium text-muted-foreground">{item.progress}%</span>
                      )}
                      {item.status === "done" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {item.status === "error" && <AlertCircle className="h-4 w-4 text-destructive" />}
                    </div>
                    {(item.status === "pending" || item.status === "error") && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(item.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {files.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Badge variant={allDone ? "success" : hasErrors ? "destructive" : "secondary"}>
                {files.filter((f) => f.status === "done").length}/{files.length} done
              </Badge>
              {isUploading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            </div>
            <div className="flex gap-2">
              {(allDone || hasErrors) && (
                <Button variant="outline" size="sm" onClick={() => setFiles([])}>Clear</Button>
              )}
              <Button variant="default" size="sm" onClick={handleClose}>
                {allDone ? "Done" : "Close"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
