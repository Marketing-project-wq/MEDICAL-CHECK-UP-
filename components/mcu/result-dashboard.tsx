"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ResultCard } from "@/components/mcu/result-card"
import { HealthScoreGauge } from "@/components/mcu/health-score-gauge"
import { FileX } from "lucide-react"
import type { MCUResult } from "@/lib/types"

interface ResultDashboardProps {
  results: MCUResult[]
  isLoading?: boolean
  healthScore?: number
}

const CATEGORIES = [
  { key: "blood", label: "Darah" },
  { key: "cholesterol", label: "Kolesterol" },
  { key: "bmi", label: "BMI" },
  { key: "liver", label: "Hati" },
  { key: "kidney", label: "Ginjal" },
] as const

type CategoryKey = (typeof CATEGORIES)[number]["key"]

function computeSummary(results: MCUResult[]) {
  let normal = 0
  let warning = 0
  let critical = 0

  for (const r of results) {
    if (r.status === "normal") normal++
    else if (r.status === "warning") warning++
    else if (r.status === "critical") critical++
  }

  return { normal, warning, critical, total: results.length }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary skeleton */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
      {/* Tabs skeleton */}
      <Skeleton className="h-10 w-full max-w-md rounded-md" />
      {/* Cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="rounded-full bg-muted p-4">
        <FileX className="h-10 w-10 text-muted-foreground" />
      </div>
      <div>
        <h3 className="text-lg font-semibold">Belum Ada Hasil</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Hasil medical check-up Anda belum tersedia. Silakan upload file MCU terlebih dahulu.
        </p>
      </div>
    </div>
  )
}

export function ResultDashboard({
  results,
  isLoading = false,
  healthScore,
}: ResultDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>(CATEGORIES[0].key)

  if (isLoading) return <LoadingSkeleton />
  if (results.length === 0) return <EmptyState />

  const summary = computeSummary(results)

  // Group results by category
  const grouped = results.reduce<Record<string, MCUResult[]>>((acc, result) => {
    const cat = result.category.toLowerCase()
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(result)
    return acc
  }, {})

  // Filter to categories that have results
  const availableCategories = CATEGORIES.filter((c) => grouped[c.key]?.length)

  return (
    <div className="space-y-6">
      {/* Summary section */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Health score */}
        {healthScore !== undefined && (
          <Card className="flex items-center justify-center p-4 sm:col-span-2 lg:col-span-1 lg:row-span-2">
            <HealthScoreGauge score={healthScore} label="Skor Kesehatan" size="md" />
          </Card>
        )}

        {/* Counters */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-4">
            <span className="text-3xl font-bold">{summary.total}</span>
            <span className="text-sm text-muted-foreground">Total Parameter</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-4">
            <span className="text-3xl font-bold text-green-600">{summary.normal}</span>
            <span className="text-sm text-muted-foreground">Normal</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-4">
            <span className="text-3xl font-bold text-yellow-600">{summary.warning}</span>
            <span className="text-sm text-muted-foreground">Perhatian</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-4">
            <span className="text-3xl font-bold text-red-600">{summary.critical}</span>
            <span className="text-sm text-muted-foreground">Kritis</span>
          </CardContent>
        </Card>
      </div>

      {/* Category tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="flex w-full flex-wrap h-auto gap-1">
          {availableCategories.map((cat) => (
            <TabsTrigger key={cat.key} value={cat.key} className="flex-1 min-w-[80px]">
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {availableCategories.map((cat) => (
          <TabsContent key={cat.key} value={cat.key}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {grouped[cat.key]?.map((result) => (
                <ResultCard
                  key={result.id}
                  parameterName={result.parameter_name}
                  value={result.value ?? 0}
                  unit={result.unit ?? ""}
                  normalRangeMin={result.normal_range_min ?? 0}
                  normalRangeMax={result.normal_range_max ?? 0}
                  status={result.status ?? "normal"}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
