import Link from "next/link"
import { Upload, ArrowLeft, FileText, Clock } from "lucide-react"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/mcu"
import { ResultDashboard } from "@/components/mcu"
import type { MCUUpload, MCUResult } from "@/lib/types"

export default async function ResultsPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch uploads
  const { data: uploads } = await supabase
    .from("mcu_uploads")
    .select("*")
    .eq("user_id", user.id)
    .order("uploaded_at", { ascending: false })
    .returns<MCUUpload[]>()

  // Fetch results for all completed uploads
  const completedIds = (uploads ?? [])
    .filter((u) => u.status === "completed")
    .map((u) => u.id)

  let results: MCUResult[] = []
  if (completedIds.length > 0) {
    const { data } = await supabase
      .from("mcu_results")
      .select("*")
      .in("upload_id", completedIds)
      .order("category", { ascending: true })
      .order("parameter_name", { ascending: true })
      .returns<MCUResult[]>()
    results = data ?? []
  }

  const hasUploads = (uploads?.length ?? 0) > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Hasil MCU</h1>
          </div>
          <p className="mt-1 text-muted-foreground">
            Lihat semua hasil Medical Check-Up Anda.
          </p>
        </div>
        <Link href="/dashboard/upload">
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload MCU Baru
          </Button>
        </Link>
      </div>

      {/* Empty state */}
      {!hasUploads && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">Belum ada hasil MCU</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Upload dokumen Medical Check-Up Anda untuk melihat analisis dan
              hasil pemeriksaan kesehatan.
            </p>
            <Link href="/dashboard/upload" className="mt-6">
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload MCU Sekarang
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Upload list */}
      {hasUploads && (
        <div className="space-y-6">
          {/* All uploads list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Riwayat Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {uploads!.map((upload) => (
                  <div
                    key={upload.id}
                    className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-muted p-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{upload.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(upload.uploaded_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={upload.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending message */}
          {uploads!.some(
            (u) => u.status === "pending" || u.status === "processing"
          ) && (
            <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20">
              <CardContent className="flex items-start gap-3 p-4">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-500" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                    Hasil sedang diproses
                  </p>
                  <p className="mt-0.5 text-sm text-yellow-700 dark:text-yellow-500">
                    Hasil sedang diproses, estimasi 1-3 hari kerja. Anda akan
                    mendapat notifikasi saat hasil sudah tersedia.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completed results */}
          {results.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Detail Hasil Pemeriksaan</h2>
              <ResultDashboard results={results} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
