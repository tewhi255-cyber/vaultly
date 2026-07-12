"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatBytes, formatDate } from "@/lib/utils"
import { UploadDialog } from "@/components/upload-dialog"
import { FilePreview } from "@/components/file-preview"
import { FileGridSkeleton, FileRowSkeleton } from "@/components/skeleton"
import { FolderActions } from "@/components/folder-actions"
import {
  Grid3X3,
  List,
  Upload,
  ImageIcon,
  VideoIcon,
  FileText,
  FileArchiveIcon,
  MusicIcon,
  FileIcon,
  Search,
  FolderPlus,
  MoreHorizontal,
  Download,
  Trash2,
  ChevronLeft,
} from "lucide-react"
import Link from "next/link"

interface FileItem {
  id: string
  name: string
  type: string
  extension: string
  mimeType: string
  size: number
  status: string
  thumbnailPath?: string | null
  createdAt: string
  updatedAt: string
  folder?: { id: string; name: string }
}

interface FolderItem {
  id: string
  name: string
  parentId: string | null
  color?: string | null
  icon?: string | null
}

const typeIcons: Record<string, any> = {
  IMAGE: ImageIcon,
  VIDEO: VideoIcon,
  DOCUMENT: FileText,
  AUDIO: MusicIcon,
  ARCHIVE: FileArchiveIcon,
  OTHER: FileIcon,
}

export default function LibraryPage() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<"grid" | "list">("grid")
  const [filter, setFilter] = useState("ALL")
  const [search, setSearch] = useState("")
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([])
  const [showUpload, setShowUpload] = useState(false)
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filter !== "ALL") params.set("type", filter)
    if (search) params.set("search", search)
    if (currentFolder) params.set("folderId", currentFolder)
    else params.set("folderId", "null")

    const [filesRes, foldersRes] = await Promise.all([
      fetch(`/api/files?${params}`),
      fetch(`/api/folders?parentId=${currentFolder || "null"}`),
    ])

    const filesData = await filesRes.json()
    const foldersData = await foldersRes.json()
    setFiles(filesData.files || [])
    setFolders(foldersData.folders || [])
    setLoading(false)
  }, [filter, search, currentFolder])

  useEffect(() => { loadData() }, [loadData])

  const navigateToFolder = useCallback(async (folderId: string) => {
    setCurrentFolder(folderId)
    const folder = folders.find((f) => f.id === folderId)
    if (folder) {
      setFolderPath((prev) => [...prev, { id: folder.id, name: folder.name }])
    }
  }, [folders])

  const navigateToParent = useCallback(() => {
    if (folderPath.length === 0) {
      setCurrentFolder(null)
      return
    }
    const newPath = [...folderPath]
    newPath.pop()
    setFolderPath(newPath)
    setCurrentFolder(newPath.length > 0 ? newPath[newPath.length - 1].id : null)
  }, [folderPath])

  async function createFolder() {
    const name = prompt("Folder name:")
    if (!name?.trim()) return
    await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), parentId: currentFolder }),
    })
    loadData()
  }

  async function updateFolder(id: string, data: { name?: string; color?: string | null; icon?: string | null }) {
    await fetch(`/api/folders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    loadData()
  }

  async function deleteFolder(id: string) {
    if (!confirm("Delete this folder and all its contents?")) return
    await fetch(`/api/folders/${id}`, { method: "DELETE" })
    loadData()
  }

  async function deleteFile(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm("Move this file to trash?")) return
    await fetch(`/api/files/${id}`, { method: "DELETE" })
    setFiles((prev) => prev.filter((f) => f.id !== id))
    setPreviewFile(null)
  }

  async function moveFile(fileId: string, targetFolderId: string | null) {
    await fetch(`/api/files/${fileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId: targetFolderId }),
    })
    loadData()
  }

  // Drag-to-move handlers for folders
  const handleFolderDragStart = (e: React.DragEvent, folderId: string) => {
    e.dataTransfer.setData("text/plain", `folder:${folderId}`)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleFileDragStart = (e: React.DragEvent, fileId: string) => {
    e.dataTransfer.setData("text/plain", `file:${fileId}`)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleFolderDrop = (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverFolder(null)
    const data = e.dataTransfer.getData("text/plain")
    if (data.startsWith("file:")) {
      const fileId = data.slice(5)
      moveFile(fileId, targetFolderId)
    }
  }

  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const data = e.dataTransfer.getData("text/plain")
    if (data.startsWith("file:")) {
      const fileId = data.slice(5)
      moveFile(fileId, null)
    }
  }

  const sortedFiles = [...files].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              {folderPath.length > 0 && (
                <Button variant="ghost" size="icon" onClick={navigateToParent}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <h2 className="text-2xl font-bold">
                {folderPath.length > 0 ? folderPath[folderPath.length - 1].name : "Library"}
              </h2>
            </div>
            {folderPath.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <button className="hover:text-foreground" onClick={() => { setCurrentFolder(null); setFolderPath([]) }}>
                  Library
                </button>
                {folderPath.map((f, i) => (
                  <span key={f.id} className="flex items-center gap-1">
                    <span>/</span>
                    <button
                      className="hover:text-foreground"
                      onClick={() => {
                        setCurrentFolder(f.id)
                        setFolderPath(folderPath.slice(0, i + 1))
                      }}
                    >
                      {f.name}
                    </button>
                  </span>
                ))}
              </div>
            )}
            {folderPath.length === 0 && (
              <p className="text-muted-foreground">Browse and manage your files</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setView("grid")} className={view === "grid" ? "bg-accent" : ""}>
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setView("list")} className={view === "list" ? "bg-accent" : ""}>
              <List className="h-4 w-4" />
            </Button>
            <div className="h-6 w-px bg-border mx-1" />
            <Button variant="outline" size="sm" onClick={createFolder}>
              <FolderPlus className="h-4 w-4 mr-1" />
              New Folder
            </Button>
            <Button size="sm" className="gap-1" onClick={() => setShowUpload(true)}>
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {["ALL", "IMAGE", "VIDEO", "DOCUMENT", "AUDIO", "OTHER"].map((t) => (
              <Button
                key={t}
                variant={filter === t ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter(t)}
                className="capitalize"
              >
                {t === "ALL" ? "All" : t.toLowerCase()}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          view === "grid" ? <FileGridSkeleton /> : (
            <div className="border rounded-lg">
              {Array.from({ length: 8 }).map((_, i) => <FileRowSkeleton key={i} />)}
            </div>
          )
        ) : folders.length === 0 && files.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-muted-foreground/25 rounded-lg"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const fl = e.dataTransfer.files; if (fl.length) setShowUpload(true) }}
          >
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">
              {search || filter !== "ALL" ? "No matching files" : "No files yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {search || filter !== "ALL"
                ? "Try adjusting your search or filters"
                : "Drag files here or click to upload"}
            </p>
            {!search && filter === "ALL" && (
              <Button onClick={() => setShowUpload(true)}>Upload Files</Button>
            )}
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {folders.map((f) => (
              <Card
                key={f.id}
                draggable
                onDragStart={(e) => handleFolderDragStart(e, f.id)}
                onDragOver={(e) => { e.preventDefault(); setDragOverFolder(f.id) }}
                onDragLeave={() => setDragOverFolder(null)}
                onDrop={(e) => handleFolderDrop(e, f.id)}
                className={`cursor-pointer hover:bg-accent/50 transition-all group relative ${
                  dragOverFolder === f.id ? "ring-2 ring-primary bg-primary/5 scale-105" : ""
                }`}
              >
                <CardContent className="p-4">
                  <FolderActions
                    folder={f}
                    onUpdate={updateFolder}
                    onDelete={deleteFolder}
                    onNavigate={navigateToFolder}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {files.filter((file) => file.folder?.id === f.id).length} files
                  </p>
                </CardContent>
              </Card>
            ))}
            {sortedFiles.map((file) => {
              const Icon = typeIcons[file.type] || FileIcon
              const fileObj: FileItem = {
                id: file.id,
                name: file.name,
                type: file.type,
                extension: file.extension,
                mimeType: file.mimeType,
                size: file.size,
                status: file.status,
                createdAt: file.createdAt,
                updatedAt: file.updatedAt,
                thumbnailPath: file.thumbnailPath,
              }
              return (
                <Card
                  key={file.id}
                  draggable
                  onDragStart={(e) => handleFileDragStart(e, file.id)}
                  onClick={() => setPreviewFile(fileObj)}
                  className="group cursor-pointer hover:bg-accent/50 transition-all overflow-hidden"
                >
                  <CardContent className="p-0">
                    {file.type === "IMAGE" && file.thumbnailPath ? (
                      <div className="h-28 bg-muted flex items-center justify-center overflow-hidden">
                        <img
                          src={`/api/files/${file.id}/thumbnail`}
                          alt={file.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="h-28 bg-muted flex items-center justify-center">
                        <Icon className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    <div className="p-3">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>
                        <Badge variant="outline" className="text-[10px] px-1">{file.extension}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b text-sm text-muted-foreground">
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Type</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Size</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Modified</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleRootDrop}
              >
                {folders.map((f) => (
                  <tr
                    key={f.id}
                    draggable
                    onDragStart={(e) => handleFolderDragStart(e, f.id)}
                    onDragOver={(e) => { e.preventDefault(); setDragOverFolder(f.id) }}
                    onDragLeave={() => setDragOverFolder(null)}
                    onDrop={(e) => handleFolderDrop(e, f.id)}
                    className={`border-b hover:bg-accent/50 transition-all ${
                      dragOverFolder === f.id ? "ring-2 ring-primary bg-primary/5" : ""
                    }`}
                  >
                    <td className="p-3">
                      <FolderActions
                        folder={f}
                        onUpdate={updateFolder}
                        onDelete={deleteFolder}
                        onNavigate={navigateToFolder}
                      />
                    </td>
                    <td className="p-3 text-sm hidden sm:table-cell">Folder</td>
                    <td className="p-3 text-sm hidden md:table-cell">-</td>
                    <td className="p-3 text-sm hidden md:table-cell">-</td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {sortedFiles.map((file) => {
                  const Icon = typeIcons[file.type] || FileIcon
                  return (
                    <tr
                      key={file.id}
                      draggable
                      onDragStart={(e) => handleFileDragStart(e, file.id)}
                      className="border-b hover:bg-accent/50 cursor-pointer"
                      onClick={() => setPreviewFile({
                        id: file.id,
                        name: file.name,
                        type: file.type,
                        extension: file.extension,
                        mimeType: file.mimeType,
                        size: file.size,
                        status: file.status,
                        createdAt: file.createdAt,
                        updatedAt: file.updatedAt,
                        thumbnailPath: file.thumbnailPath,
                      })}
                    >
                      <td className="p-3 flex items-center gap-2">
                        {file.type === "IMAGE" && file.thumbnailPath ? (
                          <img
                            src={`/api/files/${file.id}/thumbnail`}
                            alt=""
                            className="h-8 w-8 rounded object-cover"
                          />
                        ) : (
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span className="text-sm font-medium truncate">{file.name}</span>
                      </td>
                      <td className="p-3 text-sm hidden sm:table-cell capitalize">{file.type.toLowerCase()}</td>
                      <td className="p-3 text-sm hidden md:table-cell">{formatBytes(file.size)}</td>
                      <td className="p-3 text-sm hidden md:table-cell">{formatDate(file.createdAt)}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); window.open(`/api/files/${file.id}`, '_blank') }}>
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={(e) => deleteFile(file.id, e)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <UploadDialog
          open={showUpload}
          onClose={() => setShowUpload(false)}
          folderId={currentFolder}
          onComplete={loadData}
        />

        {previewFile && (
            <FilePreview
            file={previewFile}
            files={sortedFiles.map((f) => ({
              id: f.id,
              name: f.name,
              type: f.type,
              extension: f.extension,
              mimeType: f.mimeType,
              size: f.size,
              createdAt: f.createdAt,
              thumbnailPath: f.thumbnailPath,
            }))}
            onClose={() => setPreviewFile(null)}
            onNavigate={(f) => setPreviewFile(f as FileItem)}
            onDelete={(id) => { setFiles((prev) => prev.filter((x) => x.id !== id)); setPreviewFile(null) }}
          />
        )}
      </div>
    </DashboardShell>
  )
}
