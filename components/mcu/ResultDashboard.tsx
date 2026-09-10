"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { MCUResult } from "@/lib/types"

interface ResultDashboardProps {
  results: MCUResult[]
}

function getStatusColor(status: MCUResult["status"]) {
  switch (status) {
    case "normal":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
    case "warning":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
    case "critical":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
  }
}

function getStatusLabel(status: MCUResult["status"]) {
  switch (status) {
    case "normal":
      return "Normal"
    case "warning":
      return "Perlu Perhatian"
    case "critical":
      return "Kritis"
    default:
      return "Tidak Diketahui"
  }
}

function getProgressValue(result: MCUResult): number {
  if (
    result.value == null ||
    result.normal_range_min == null ||
    result.normal_range_max == null
  ) {
    return 50
  }
  const range = result.normal_range_max - result.normal_range_min
  if (range === 0) return 50
  const normalized =
    ((result.value - result.normal_range_min) / range) * 100
  return Math.max(0, Math.min(100, normalized))
}

export function ResultDashboard({ results }: ResultDashboardProps) {
  // Group by category
  const grouped = results.reduce<Record<string, MCUResult[]>>((acc, result) => {
    const cat = result.category || "Lainnya"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(result)
    return acc
  }, {})

  const categories = Object.keys(grouped).sort()

  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Tidak ada hasil untuk ditampilkan.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-base">{category}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {grouped[category].map((result) => (
                <div
                  key={result.id}
                  className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {result.parameter_name}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(
                          result.status
                        )}`}
                      >
                        {getStatusLabel(result.status)}
                      </span>
                    </div>
                    {result.notes && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {result.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 sm:w-48 sm:shrink-0">
                    <div className="flex-1">
                      <Progress
                        value={getProgressValue(result)}
                        className="h-2"
                      />
                    </div>
                    <div className="text-right text-sm tabular-nums">
                      <span className="font-medium">
                        {result.value ?? "-"}
                      </span>
                      {result.unit && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          {result.unit}
                        </span>
                      )}
                    </div>
                  </div>
                  {(result.normal_range_min != null ||
                    result.normal_range_max != null) && (
                    <p className="text-xs text-muted-foreground sm:w-28 sm:shrink-0 sm:text-right">
                      Ref: {result.normal_range_min ?? "?"} -{" "}
                      {result.normal_range_max ?? "?"} {result.unit ?? ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
