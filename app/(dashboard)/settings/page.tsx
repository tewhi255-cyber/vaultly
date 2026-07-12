"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useTheme } from "next-themes"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar } from "@/components/ui/avatar"
import { User, Shield, Bell, Palette, Moon, Sun, Monitor, Check } from "lucide-react"
import { toast } from "sonner"

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [name, setName] = useState(session?.user?.name || "")
  const [saving, setSaving] = useState(false)

  async function handleSaveProfile() {
    setSaving(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        toast.success("Profile updated")
        update()
      } else {
        const err = await res.json()
        toast.error(err.error?.message || "Failed to update profile")
      }
    } catch {
      toast.error("Network error")
    }
    setSaving(false)
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-muted-foreground">Manage your account settings</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5" />
              <div>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar
                src={session?.user?.image || undefined}
                alt={session?.user?.name || "User"}
                className="h-16 w-16"
              />
              <Button variant="outline" size="sm">Change Avatar</Button>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input value={session?.user?.email || ""} disabled />
            </div>
            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Palette className="h-5 w-5" />
              <div>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize your interface</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "light", label: "Light", icon: Sun },
                  { value: "dark", label: "Dark", icon: Moon },
                  { value: "system", label: "System", icon: Monitor },
                ].map((t) => {
                  const Icon = t.icon
                  const active = theme === t.value
                  return (
                    <button
                      key={t.value}
                      onClick={() => setTheme(t.value)}
                      className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all ${
                        active
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "hover:bg-accent"
                      }`}
                    >
                      <Icon className={`h-6 w-6 ${active ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-sm font-medium">{t.label}</span>
                      {active && <Check className="h-3 w-3 text-primary" />}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Current: {resolvedTheme === "dark" ? "Dark" : "Light"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
