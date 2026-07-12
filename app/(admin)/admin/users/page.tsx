"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { formatBytes, formatDate, formatRelativeTime } from "@/lib/utils"
import {
  Search,
  Loader2,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  Shield,
  ShieldOff,
  Trash2,
  KeyRound,
  UserCog,
  HardDrive,
  Activity,
  FileText,
  AlertTriangle,
  Eye,
  Copy,
  Check,
  PieChart,
  Clock,
  Download,
  LogOut,
  Crown,
} from "lucide-react"
import { PieChart as RPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

const COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6", "#6b7280"]

function ConfirmDialog({
  open,
  title,
  description,
  confirmText,
  confirmString,
  onConfirm,
  onCancel,
  destructive = false,
}: {
  open: boolean
  title: string
  description: string
  confirmText: string
  confirmString: string
  onConfirm: () => void
  onCancel: () => void
  destructive?: boolean
}) {
  const [typed, setTyped] = useState("")

  useEffect(() => {
    if (open) setTyped("")
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative z-[61] w-full max-w-md rounded-xl border bg-card p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-full ${destructive ? "bg-red-100 dark:bg-red-900/30" : "bg-muted"}`}>
            <AlertTriangle className={`h-5 w-5 ${destructive ? "text-red-500" : "text-muted-foreground"}`} />
          </div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Type <span className="font-mono font-bold text-foreground">{confirmString}</span> to confirm:
          </p>
          <Input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={confirmString}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button
              variant={destructive ? "destructive" : "default"}
              disabled={typed !== confirmString}
              onClick={onConfirm}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [cursor, setCursor] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [userDetail, setUserDetail] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [confirmAction, setConfirmAction] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (roleFilter) params.set("role", roleFilter)
    if (statusFilter) params.set("status", statusFilter)
    if (cursor) params.set("cursor", cursor)
    params.set("limit", "20")

    const res = await fetch(`/api/admin/users?${params}`)
    const data = await res.json()
    setUsers(data.users || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [search, roleFilter, statusFilter, cursor])

  useEffect(() => { loadUsers() }, [loadUsers])

  const loadUserDetail = useCallback(async (id: string) => {
    setDetailLoading(true)
    setSelectedUserId(id)
    const res = await fetch(`/api/admin/users/${id}`)
    if (res.ok) {
      const data = await res.json()
      setUserDetail(data)
    }
    setDetailLoading(false)
  }, [])

  async function handleAction(action: string) {
    if (!selectedUserId) return
    setActionLoading(action)

    if (action === "suspend") {
      await fetch(`/api/admin/users/${selectedUserId}/suspend`, { method: "POST" })
    } else if (action === "reactivate") {
      await fetch(`/api/admin/users/${selectedUserId}/reactivate`, { method: "POST" })
    } else if (action === "delete") {
      await fetch(`/api/admin/users/${selectedUserId}`, { method: "DELETE" })
    } else if (action === "impersonate") {
      const res = await fetch(`/api/admin/users/${selectedUserId}/impersonate`, { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        const impersonateUrl = `${window.location.origin}/api/auth/impersonate?token=${data.token}`
        window.open(impersonateUrl, "_blank")
      }
    } else if (action === "reset-password") {
      await fetch(`/api/admin/users/${selectedUserId}/reset-password`, { method: "POST" })
    }

    setActionLoading(null)
    setConfirmAction(null)
    loadUsers()
    if (selectedUserId) loadUserDetail(selectedUserId)
  }

  function getStoragePercent(used: number | bigint, quota: number | bigint) {
    return Math.round((Number(used) / Number(quota)) * 100)
  }

  const detailUser = userDetail?.user
  const pieData = (userDetail?.typeBreakdown || []).map((item: any) => ({
    name: item.type.charAt(0) + item.type.slice(1).toLowerCase(),
    value: Number(item._sum.size) || 0,
  }))

  return (
    <DashboardShell role="ADMIN">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Users</h2>
            <p className="text-muted-foreground">{total} total users</p>
          </div>
          <Button>Add User</Button>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No users found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50 text-sm text-muted-foreground">
                  <th className="text-left p-3 font-medium">User</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Role</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Storage</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Files</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Status</th>
                  <th className="text-left p-3 font-medium hidden xl:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: any) => (
                  <tr
                    key={user.id}
                    className={`border-b hover:bg-accent/50 cursor-pointer transition-colors ${
                      selectedUserId === user.id ? "bg-accent" : ""
                    }`}
                    onClick={() => loadUserDetail(user.id)}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={user.image || undefined}
                          alt={user.name || "User"}
                          fallback={user.name?.charAt(0) || "U"}
                        />
                        <div>
                          <p className="text-sm font-medium">{user.name || "Unnamed"}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                        {user.role}
                        {user.adminRole === "SUPER_ADMIN" && (
                          <Crown className="h-3 w-3 ml-1" />
                        )}
                      </Badge>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <div className="space-y-1 max-w-[140px]">
                        <div className="flex items-center justify-between text-xs">
                          <span>{formatBytes(user.storageUsed)}</span>
                          <span className="text-muted-foreground">/ {formatBytes(user.storageQuota)}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary/60 transition-all"
                            style={{ width: `${Math.min(getStoragePercent(user.storageUsed, user.storageQuota), 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3 hidden lg:table-cell text-sm">{user._count?.files || 0}</td>
                    <td className="p-3 hidden lg:table-cell">
                      <Badge variant={user.status === "active" ? "success" : "destructive"}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="p-3 hidden xl:table-cell text-sm text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {users.length} of {total} users
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!cursor} onClick={() => { setCursor(null); setSelectedUserId(null) }}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => { if (users.length > 0) setCursor(users[users.length - 1].id) }}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        {selectedUserId && (
          <div className="fixed inset-0 z-50 flex items-start justify-end">
            <div className="fixed inset-0 bg-black/50" onClick={() => { setSelectedUserId(null); setUserDetail(null) }} />
            <div className="relative z-50 w-full max-w-xl h-full overflow-y-auto bg-background border-l shadow-xl">
              <div className="sticky top-0 z-10 bg-background border-b px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">User Details</h3>
                <Button variant="ghost" size="icon" onClick={() => { setSelectedUserId(null); setUserDetail(null) }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {detailLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : detailUser ? (
                <div className="p-6 space-y-6">
                  {/* Profile Summary */}
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={detailUser.image || undefined}
                      alt={detailUser.name || "User"}
                      className="h-16 w-16"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-semibold">{detailUser.name || "Unnamed"}</p>
                        <Badge variant={detailUser.role === "ADMIN" ? "default" : "secondary"}>
                          {detailUser.role}
                          {detailUser.adminRole === "SUPER_ADMIN" && " · Super"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{detailUser.email}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Joined {formatDate(detailUser.createdAt)}</span>
                        <span className="flex items-center gap-1"><LogOut className="h-3 w-3" /> Last login {detailUser.lastLoginAt ? formatRelativeTime(detailUser.lastLoginAt) : "never"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Storage Panel */}
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <HardDrive className="h-4 w-4" />
                        Storage Usage
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{formatBytes(detailUser.storageUsed)}</span>
                          <span className="text-muted-foreground">of {formatBytes(detailUser.storageQuota)}</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              getStoragePercent(detailUser.storageUsed, detailUser.storageQuota) > 90
                                ? "bg-red-500"
                                : getStoragePercent(detailUser.storageUsed, detailUser.storageQuota) > 70
                                ? "bg-yellow-500"
                                : "bg-primary"
                            }`}
                            style={{ width: `${Math.min(getStoragePercent(detailUser.storageUsed, detailUser.storageQuota), 100)}%` }}
                          />
                        </div>
                      </div>

                      {pieData.length > 0 && (
                        <div className="mt-4">
                          <div className="h-32">
                            <ResponsiveContainer width="100%" height="100%">
                              <RPieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value">
                                  {pieData.map((_: any, i: number) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(v: number) => formatBytes(v)} />
                              </RPieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="flex flex-wrap gap-3 mt-2">
                            {pieData.map((item: any, i: number) => (
                              <div key={item.name} className="flex items-center gap-1 text-xs">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                <span>{item.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent Files */}
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Recent Files
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {userDetail?.recentFiles?.length > 0 ? (
                        <div className="space-y-2">
                          {userDetail.recentFiles.slice(0, 5).map((file: any) => (
                            <div key={file.id} className="flex items-center justify-between text-sm py-1">
                              <span className="truncate flex-1">{file.name}</span>
                              <span className="text-muted-foreground ml-2">{formatBytes(file.size)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No files</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Activity Timeline */}
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Activity Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-60 overflow-y-auto">
                      {userDetail?.activities?.length > 0 ? (
                        <div className="space-y-3">
                          {userDetail.activities.map((act: any) => (
                            <div key={act.id} className="flex items-start gap-3 text-sm">
                              <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                                act.status === "failed" ? "bg-red-500" : "bg-green-500"
                              }`} />
                              <div className="flex-1 min-w-0">
                                <p className="truncate">
                                  <span className="capitalize">{act.action.replace(/_/g, " ")}</span>
                                  <span className="text-muted-foreground"> · {act.entityType}</span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatRelativeTime(act.createdAt)}
                                  {act.ipAddress && ` · ${act.ipAddress}`}
                                  {act.deviceInfo && ` · ${act.deviceInfo}`}
                                </p>
                              </div>
                              <Badge variant={act.status === "failed" ? "destructive" : "secondary"} className="text-[10px] px-1">
                                {act.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No activity recorded</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Danger Zone */}
                  <Card className="border-red-200 dark:border-red-900">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2 text-red-500">
                        <ShieldOff className="h-4 w-4" />
                        Danger Zone
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {detailUser.status === "active" ? "Suspend Account" : "Reactivate Account"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {detailUser.status === "active" ? "Disables login immediately" : "Restores account access"}
                          </p>
                        </div>
                        <Button
                          variant={detailUser.status === "active" ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => setConfirmAction(detailUser.status === "active" ? "suspend" : "reactivate")}
                        >
                          {detailUser.status === "active" ? "Suspend" : "Reactivate"}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Reset Password</p>
                          <p className="text-xs text-muted-foreground">Sends a password reset email</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleAction("reset-password")}>
                          <KeyRound className="h-3 w-3 mr-1" />
                          Reset
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Impersonate</p>
                          <p className="text-xs text-muted-foreground">Log in as this user (30 min session)</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleAction("impersonate")}>
                          <Eye className="h-3 w-3 mr-1" />
                          Impersonate
                        </Button>
                      </div>

                      <hr className="border-red-200 dark:border-red-900" />

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-red-500">Delete Account</p>
                          <p className="text-xs text-muted-foreground">
                            Permanently delete {detailUser.name || "this user"} and all their data
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setConfirmAction("delete")}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                  Failed to load user details
                </div>
              )}
            </div>
          </div>
        )}

        <ConfirmDialog
          open={confirmAction === "suspend"}
          title="Suspend Account"
          description="This will immediately disable login access for this user."
          confirmText="Suspend Account"
          confirmString={detailUser?.email || "EMAIL"}
          onConfirm={() => handleAction("suspend")}
          onCancel={() => setConfirmAction(null)}
          destructive
        />

        <ConfirmDialog
          open={confirmAction === "reactivate"}
          title="Reactivate Account"
          description="This will restore login access for this user."
          confirmText="Reactivate Account"
          confirmString={detailUser?.email || "EMAIL"}
          onConfirm={() => handleAction("reactivate")}
          onCancel={() => setConfirmAction(null)}
        />

        <ConfirmDialog
          open={confirmAction === "delete"}
          title="Delete Account"
          description={`This will permanently delete ${detailUser?.name || "this user"}'s account and all ${detailUser?._count?.files || 0} files (${formatBytes(detailUser?.storageUsed || 0)}). This cannot be undone.`}
          confirmText="Permanently Delete"
          confirmString={detailUser?.email || "EMAIL"}
          onConfirm={() => handleAction("delete")}
          onCancel={() => setConfirmAction(null)}
          destructive
        />
      </div>
    </DashboardShell>
  )
}
