"use client"

import { useState, useEffect } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Loader2, Save, Sliders, Shield, ShieldCheck, Crown, UserCog } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null)
  const [admins, setAdmins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/settings").then((r) => r.json()),
      fetch("/api/admin/users?role=ADMIN&limit=50").then((r) => r.json()),
    ]).then(([settingsData, usersData]) => {
      setSettings(settingsData.settings)
      setAdmins(usersData.users || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    })
    setSaving(false)
  }

  async function changeAdminRole(userId: string, newRole: string) {
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminRole: newRole }),
    })
    setAdmins((prev) =>
      prev.map((a) => (a.id === userId ? { ...a, adminRole: newRole } : a))
    )
  }

  if (loading) {
    return (
      <DashboardShell role="ADMIN">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="ADMIN">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Platform Settings</h2>
            <p className="text-muted-foreground">Configure global platform settings</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sliders className="h-4 w-4" />
              Storage & Limits
            </CardTitle>
            <CardDescription>Configure storage quotas and upload limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Default Storage Quota (GB)</label>
                <Input
                  type="number"
                  value={settings?.defaultStorageQuotaGb || 5}
                  onChange={(e) => setSettings({ ...settings, defaultStorageQuotaGb: parseInt(e.target.value) || 5 })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Upload Size (MB)</label>
                <Input
                  type="number"
                  value={settings?.maxUploadSizeMb || 500}
                  onChange={(e) => setSettings({ ...settings, maxUploadSizeMb: parseInt(e.target.value) || 500 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Allowed Extensions</label>
              <Input
                value={settings?.allowedExtensions || ""}
                onChange={(e) => setSettings({ ...settings, allowedExtensions: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Blocked Extensions</label>
              <Input
                value={settings?.blockedExtensions || ""}
                onChange={(e) => setSettings({ ...settings, blockedExtensions: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">General</CardTitle>
            <CardDescription>Manage platform-wide toggles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "enablePublicSignups", label: "Enable Public Sign-ups" },
              { key: "enablePublicShares", label: "Enable Public Sharing" },
              { key: "maintenanceMode", label: "Maintenance Mode" },
              { key: "showAnnouncement", label: "Show Announcement Banner" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <label className="text-sm font-medium">{item.label}</label>
                <button
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings?.[item.key] ? "bg-primary" : "bg-input"
                  }`}
                  onClick={() => setSettings({ ...settings, [item.key]: !settings?.[item.key] })}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      settings?.[item.key] ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            ))}
            {settings?.showAnnouncement && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Announcement Text</label>
                <Input
                  value={settings?.siteAnnouncement || ""}
                  onChange={(e) => setSettings({ ...settings, siteAnnouncement: e.target.value })}
                  placeholder="Enter announcement text..."
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Admin Roles
            </CardTitle>
            <CardDescription>Manage admin accounts and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {admins.map((admin: any) => (
                <div key={admin.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <Avatar
                    src={admin.image || undefined}
                    alt={admin.name || "Admin"}
                    fallback={admin.name?.charAt(0) || "A"}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{admin.name || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground">{admin.email}</p>
                  </div>
                  <select
                    className="h-8 rounded-md border border-input bg-background px-2 text-sm outline-none"
                    value={admin.adminRole || "MODERATOR"}
                    onChange={(e) => changeAdminRole(admin.id, e.target.value)}
                  >
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="MODERATOR">Moderator</option>
                  </select>
                  <Badge variant={admin.adminRole === "SUPER_ADMIN" ? "default" : "secondary"}>
                    {admin.adminRole === "SUPER_ADMIN" ? (
                      <><Crown className="h-3 w-3 mr-1" />Super</>
                    ) : "Moderator"}
                  </Badge>
                </div>
              ))}
              {admins.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No admin accounts found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
