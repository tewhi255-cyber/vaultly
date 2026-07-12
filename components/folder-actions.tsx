"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Pencil,
  Trash2,
  Palette,
  X,
  Check,
  FolderOpen,
  FolderClosed,
} from "lucide-react"

const FOLDER_COLORS = [
  { name: "Default", value: null, bg: "bg-yellow-500" },
  { name: "Red", value: "red", bg: "bg-red-500" },
  { name: "Orange", value: "orange", bg: "bg-orange-500" },
  { name: "Green", value: "green", bg: "bg-green-500" },
  { name: "Blue", value: "blue", bg: "bg-blue-500" },
  { name: "Purple", value: "purple", bg: "bg-purple-500" },
  { name: "Pink", value: "pink", bg: "bg-pink-500" },
  { name: "Teal", value: "teal", bg: "bg-teal-500" },
]

const FOLDER_ICONS = [
  { name: "Folder", value: "folder" },
  { name: "Images", value: "image" },
  { name: "Videos", value: "video" },
  { name: "Music", value: "music" },
  { name: "Documents", value: "document" },
  { name: "Archive", value: "archive" },
  { name: "Downloads", value: "download" },
  { name: "Star", value: "star" },
]

interface FolderActionsProps {
  folder: { id: string; name: string; color?: string | null; icon?: string | null }
  onUpdate: (id: string, data: { name?: string; color?: string | null; icon?: string | null }) => void
  onDelete: (id: string) => void
  onNavigate: (id: string) => void
}

export function FolderActions({ folder, onUpdate, onDelete, onNavigate }: FolderActionsProps) {
  const [open, setOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(folder.name)

  function handleRename() {
    if (newName.trim() && newName !== folder.name) {
      onUpdate(folder.id, { name: newName.trim() })
    }
    setRenaming(false)
  }

  function setColor(value: string | null) {
    onUpdate(folder.id, { color: value })
  }

  function setIcon(value: string | null) {
    onUpdate(folder.id, { icon: value })
  }

  return (
    <div className="relative">
      <div
        className="flex items-center gap-2 cursor-pointer group"
        onDoubleClick={(e) => { e.stopPropagation(); setRenaming(true) }}
      >
        <div
          className="shrink-0"
          onClick={(e) => { e.stopPropagation(); onNavigate(folder.id) }}
        >
          {folder.color ? (
            <div className={`h-10 w-10 rounded-xl ${FOLDER_COLORS.find(c => c.value === folder.color)?.bg || 'bg-yellow-500'} flex items-center justify-center`}>
              <FolderOpen className="h-5 w-5 text-white" />
            </div>
          ) : (
            <FolderOpen
              className={`h-10 w-10 ${folder.color === "red" ? "text-red-500" : folder.color === "blue" ? "text-blue-500" : folder.color === "green" ? "text-green-500" : folder.color === "purple" ? "text-purple-500" : folder.color === "orange" ? "text-orange-500" : folder.color === "pink" ? "text-pink-500" : folder.color === "teal" ? "text-teal-500" : "text-yellow-500"}`}
            />
          )}
        </div>
        {renaming ? (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-7 text-sm w-32"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setRenaming(false) }}
            />
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRename}>
              <Check className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setRenaming(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <span className="text-sm font-medium truncate max-w-[120px]">{folder.name}</span>
        )}
      </div>

      {!renaming && (
        <div className="absolute top-0 right-0 hidden group-hover:flex items-center gap-0.5 bg-background/80 backdrop-blur-sm rounded-md px-1">
          <button
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent"
            onClick={(e) => { e.stopPropagation(); setRenaming(true) }}
            title="Rename"
          >
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </button>
          <div className="relative group/color">
            <button
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent"
              onClick={(e) => e.stopPropagation()}
              title="Color"
            >
              <Palette className="h-3 w-3 text-muted-foreground" />
            </button>
            <div className="absolute top-full right-0 mt-1 z-50 hidden group-hover/color:block">
              <div className="bg-card border rounded-lg p-2 shadow-lg w-48">
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Folder Color</p>
                <div className="flex flex-wrap gap-1.5">
                  {FOLDER_COLORS.map((c) => (
                    <button
                      key={c.value || "default"}
                      className={`h-5 w-5 rounded-full ${c.bg || "bg-muted border"} ${folder.color === c.value ? "ring-2 ring-ring ring-offset-1" : ""}`}
                      onClick={(e) => { e.stopPropagation(); setColor(c.value) }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <button
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onDelete(folder.id) }}
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}
