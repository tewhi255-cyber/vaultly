"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatBytes, formatRelativeTime } from "@/lib/utils"
import { StatsCardSkeleton, ActivitySkeleton } from "@/components/skeleton"
import {
  Upload,
  HardDrive,
  FileText,
  FolderOpen,
  Share2,
  ImageIcon,
  VideoIcon,
  MusicIcon,
  FileArchiveIcon,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"

interface DashboardData {
  storageUsed: number
  storageQuota: number
  filesCount: number
  foldersCount: number
  shareLinksCount: number
  typeBreakdown: { type: string; _sum: { size: number | null }; _count: number }[]
  recentFiles: any[]
  recentActivity: any[]
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard/summary")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const usagePercent = data ? Math.round((data.storageUsed / data.storageQuota) * 100) : 0
  const usageColor = usagePercent > 90 ? "bg-red-500" : usagePercent > 70 ? "bg-yellow-500" : "bg-green-500"

  return (
    <DashboardShell>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Welcome back, {session?.user?.name || "User"}</h2>
            <p className="text-muted-foreground">Here's your storage overview</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <>
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </>
          ) : (
            <>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <HardDrive className="h-8 w-8 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Storage Used</p>
                      <p className="text-2xl font-bold">{formatBytes(data?.storageUsed || 0)}</p>
                      <div className="mt-2 h-2 w-full rounded-full bg-muted">
                        <div className={`h-full rounded-full ${usageColor} transition-all`} style={{ width: `${Math.min(usagePercent, 100)}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{usagePercent}% of {formatBytes(data?.storageQuota || 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Files</p>
                      <p className="text-2xl font-bold">{data?.filesCount || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <FolderOpen className="h-8 w-8 text-yellow-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Folders</p>
                      <p className="text-2xl font-bold">{data?.foldersCount || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <Share2 className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Shared Links</p>
                      <p className="text-2xl font-bold">{data?.shareLinksCount || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Storage by Type</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3"><ActivitySkeleton /></div>
              ) : (
                <div className="space-y-3">
                  {data?.typeBreakdown?.map((item) => (
                    <div key={item.type} className="flex items-center gap-3">
                      {item.type === "IMAGE" && <ImageIcon className="h-4 w-4 text-blue-500" />}
                      {item.type === "VIDEO" && <VideoIcon className="h-4 w-4 text-red-500" />}
                      {item.type === "AUDIO" && <MusicIcon className="h-4 w-4 text-purple-500" />}
                      {item.type === "DOCUMENT" && <FileText className="h-4 w-4 text-orange-500" />}
                      {item.type === "OTHER" && <FileArchiveIcon className="h-4 w-4 text-gray-500" />}
                      <span className="flex-1 text-sm capitalize">{item.type.toLowerCase()}</span>
                      <span className="text-sm font-medium">{formatBytes(item._sum.size || 0)}</span>
                      <span className="text-xs text-muted-foreground">({item._count} files)</span>
                    </div>
                  ))}
                  {(!data?.typeBreakdown || data.typeBreakdown.length === 0) && (
                    <p className="text-sm text-muted-foreground">No files uploaded yet</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <Link href="/library" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ActivitySkeleton />
              ) : (
                <div className="space-y-4">
                  {data?.recentActivity?.slice(0, 8).map((activity: any) => (
                    <div key={activity.id} className="flex items-center gap-3 text-sm">
                      <div
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          activity.status === "failed" ? "bg-red-500" : "bg-primary/50"
                        }`}
                      />
                      <span className="flex-1 capitalize truncate">{activity.action.replace(/_/g, " ")}</span>
                      <span className="text-muted-foreground shrink-0">{formatRelativeTime(activity.createdAt)}</span>
                    </div>
                  ))}
                  {(!data?.recentActivity || data.recentActivity.length === 0) && (
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Files</h3>
            <Link href="/library" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {loading ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="min-w-[160px] shrink-0 rounded-lg border p-4 space-y-3">
                  <div className="h-8 w-8 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {data?.recentFiles?.map((file: any) => (
                <Card key={file.id} className="min-w-[160px] shrink-0">
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center gap-2">
                      {file.type === "IMAGE" && file.thumbnailPath ? (
                        <img
                          src={`/api/files/${file.id}/thumbnail`}
                          alt=""
                          className="h-12 w-12 rounded object-cover"
                        />
                      ) : file.type === "IMAGE" ? (
                        <ImageIcon className="h-8 w-8 text-blue-500" />
                      ) : file.type === "VIDEO" ? (
                        <VideoIcon className="h-8 w-8 text-red-500" />
                      ) : (
                        <FileText className="h-8 w-8 text-gray-500" />
                      )}
                      <p className="text-sm font-medium text-center truncate w-full">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!data?.recentFiles || data.recentFiles.length === 0) && (
                <div className="flex items-center justify-center w-full py-8 text-sm text-muted-foreground">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload your first file to get started
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
