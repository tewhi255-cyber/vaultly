"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { useSession, signOut } from "next-auth/react"
import { UploadDialog } from "@/components/upload-dialog"
import {
  Menu,
  X,
  Upload,
  Bell,
  Search,
  ChevronLeft,
  LogOut,
  Settings,
  Cloud,
  Moon,
  Sun,
} from "lucide-react"
import { userNavLinks, adminNavLinks, type NavLink } from "@/lib/nav-config"

interface DashboardShellProps {
  children: React.ReactNode
  role?: string
}

export function DashboardShell({ children, role = "USER" }: DashboardShellProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  const isAdmin = role === "ADMIN" || pathname.startsWith("/admin")
  const navLinks = isAdmin ? adminNavLinks : userNavLinks
  const breadcrumb = navLinks.find((l) => pathname === l.href || pathname.startsWith(l.href + "/"))

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-sidebar transition-all duration-300 lg:static",
          collapsed ? "w-16" : "w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className={cn("flex h-14 items-center border-b px-4", collapsed && "justify-center")}>
          {!collapsed && (
            <Link href={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-2 font-semibold">
              <Cloud className="h-5 w-5 text-primary" />
              <span>Vaultly</span>
            </Link>
          )}
          {collapsed && (
            <Link href={isAdmin ? "/admin" : "/dashboard"}>
              <Cloud className="h-5 w-5 text-primary" />
            </Link>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? link.label : undefined}
              >
                <link.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{link.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className={cn("border-t p-4 space-y-3", collapsed && "flex flex-col items-center")}>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors w-full",
              collapsed && "justify-center px-2"
            )}
          >
            {theme === "dark" ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
            {!collapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
          </button>

          {!collapsed && session?.user && (
            <div className="flex items-center gap-3">
              <Avatar
                src={session.user.image || undefined}
                alt={session.user.name || "User"}
                fallback={session.user.name?.charAt(0) || "U"}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{session.user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden lg:flex" onClick={() => setCollapsed(!collapsed)}>
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </Button>

          <div className="flex-1">
            {breadcrumb && (
              <h1 className="text-lg font-semibold">{breadcrumb.label}</h1>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search..."
                className="h-9 w-64 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none focus:border-ring"
              />
            </div>
            <Button variant="ghost" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
            {!isAdmin && (
              <Button size="sm" className="gap-1" onClick={() => setShowUpload(true)}>
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Upload</span>
              </Button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-8">
          {children}
        </main>
      </div>

      {!isAdmin && (
        <UploadDialog
          open={showUpload}
          onClose={() => setShowUpload(false)}
          onComplete={() => window.location.reload()}
        />
      )}
    </div>
  )
}
