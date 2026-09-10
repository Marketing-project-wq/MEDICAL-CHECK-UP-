import Link from "next/link"
import {
  Upload,
  FileSearch,
  BookOpen,
  Activity,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { Profile, MCUUpload, MCUResult, QuizResponse } from "@/lib/types"

export default async function DashboardPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>()

  // Fetch MCU uploads
  const { data: uploads } = await supabase
    .from("mcu_uploads")
    .select("*")
    .eq("user_id", user.id)
    .order("uploaded_at", { ascending: false })
    .returns<MCUUpload[]>()

  // Fetch quiz responses count
  const { count: quizCount } = await supabase
    .from("quiz_responses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  // Fetch latest completed results
  const latestCompleted = uploads?.find((u) => u.status === "completed")
  let latestResults: MCUResult[] = []
  if (latestCompleted) {
    const { data } = await supabase
      .from("mcu_results")
      .select("*")
      .eq("upload_id", latestCompleted.id)
      .returns<MCUResult[]>()
    latestResults = data ?? []
  }

  const totalUploads = uploads?.length ?? 0
  const latestUpload = uploads?.[0]
  const latestStatus = latestUpload?.status ?? null
  const quizzesCompleted = quizCount ?? 0
  const articlesRead = 0 // placeholder

  const displayName = profile?.full_name || user.email?.split("@")[0] || "User"

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
    pending: {
      label: "Pending",
      variant: "outline",
      icon: <Clock className="h-3.5 w-3.5" />,
    },
    processing: {
      label: "Processing",
      variant: "secondary",
      icon: <Clock className="h-3.5 w-3.5" />,
    },
    completed: {
      label: "Completed",
      variant: "default",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
    failed: {
      label: "Failed",
      variant: "destructive",
      icon: <AlertCircle className="h-3.5 w-3.5" />,
    },
  }

  const warningCount = latestResults.filter((r) => r.status === "warning").length
  const criticalCount = latestResults.filter((r) => r.status === "critical").length

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Selamat datang, {displayName}!
        </h1>
        <p className="mt-1 text-muted-foreground">
          Pantau kesehatan Anda melalui dashboard Medical Check-Up.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Upload MCU</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUploads}</div>
            <p className="text-xs text-muted-foreground">
              dokumen MCU terupload
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Status Terakhir</CardTitle>
            <FileSearch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {latestStatus ? (
              <div className="flex items-center gap-2">
                <Badge variant={statusConfig[latestStatus]?.variant ?? "outline"}>
                  <span className="mr-1">{statusConfig[latestStatus]?.icon}</span>
                  {statusConfig[latestStatus]?.label ?? latestStatus}
                </Badge>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada upload</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              status MCU terbaru
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quiz Selesai</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizzesCompleted}</div>
            <p className="text-xs text-muted-foreground">
              quiz kesehatan diselesaikan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Artikel Dibaca</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{articlesRead}</div>
            <p className="text-xs text-muted-foreground">
              artikel kesehatan dibaca
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent MCU Results */}
      {latestResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Ringkasan Hasil MCU Terbaru</CardTitle>
              <Link href="/dashboard/results">
                <Button variant="ghost" size="sm">
                  Lihat Detail
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950/20">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">Normal</p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-300">
                  {latestResults.filter((r) => r.status === "normal").length}
                </p>
                <p className="text-xs text-green-600 dark:text-green-500">parameter</p>
              </div>
              <div className="rounded-lg border bg-yellow-50 p-4 dark:bg-yellow-950/20">
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Warning</p>
                <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-300">
                  {warningCount}
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-500">parameter</p>
              </div>
              <div className="rounded-lg border bg-red-50 p-4 dark:bg-red-950/20">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">Critical</p>
                <p className="text-2xl font-bold text-red-800 dark:text-red-300">
                  {criticalCount}
                </p>
                <p className="text-xs text-red-600 dark:text-red-500">parameter</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/dashboard/upload" className="group">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Upload MCU Baru</p>
                <p className="text-sm text-muted-foreground">
                  Unggah dokumen MCU terbaru Anda
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/quizzes" className="group">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-secondary/10 p-3">
                <Activity className="h-6 w-6 text-secondary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Ambil Quiz</p>
                <p className="text-sm text-muted-foreground">
                  Tes pengetahuan kesehatan Anda
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/articles" className="group">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-accent p-3">
                <BookOpen className="h-6 w-6 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Baca Artikel</p>
                <p className="text-sm text-muted-foreground">
                  Tips dan informasi kesehatan
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
