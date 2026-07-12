import {
  LayoutDashboard,
  FolderOpen,
  Share2,
  Trash2,
  Settings,
  Shield,
  Users,
  FileText,
  Activity,
  HardDrive,
  Sliders,
} from "lucide-react"

export interface NavLink {
  label: string
  href: string
  icon: any
}

export const userNavLinks: NavLink[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Library", href: "/library", icon: FolderOpen },
  { label: "Shared", href: "/shared", icon: Share2 },
  { label: "Trash", href: "/trash", icon: Trash2 },
  { label: "Settings", href: "/settings", icon: Settings },
]

export const adminNavLinks: NavLink[] = [
  { label: "Overview", href: "/admin", icon: Shield },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Files", href: "/admin/files", icon: FileText },
  { label: "Moderation", href: "/admin/moderation", icon: Activity },
  { label: "Storage", href: "/admin/storage", icon: HardDrive },
  { label: "Settings", href: "/admin/settings", icon: Sliders },
  { label: "Audit Log", href: "/admin/audit-log", icon: FileText },
]
