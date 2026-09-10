import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { MCUResultStatus } from "@/lib/types"

interface ResultCardProps {
  parameterName: string
  value: number
  unit: string
  normalRangeMin: number
  normalRangeMax: number
  status: MCUResultStatus
}

const STATUS_CONFIG = {
  normal: {
    label: "Normal",
    badgeClass: "bg-green-100 text-green-700 border-green-200 hover:bg-green-100",
    valueClass: "text-green-600",
    barClass: "bg-green-500",
    dotClass: "bg-green-500 border-green-300",
  },
  warning: {
    label: "Perhatian",
    badgeClass: "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100",
    valueClass: "text-yellow-600",
    barClass: "bg-yellow-500",
    dotClass: "bg-yellow-500 border-yellow-300",
  },
  critical: {
    label: "Kritis",
    badgeClass: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100",
    valueClass: "text-red-600",
    barClass: "bg-red-500",
    dotClass: "bg-red-500 border-red-300",
  },
} as const

export function ResultCard({
  parameterName,
  value,
  unit,
  normalRangeMin,
  normalRangeMax,
  status,
}: ResultCardProps) {
  const config = STATUS_CONFIG[status]

  // Calculate the position of the value on the indicator bar.
  // Extend the visual range 20% beyond the normal range on each side.
  const rangeSpan = normalRangeMax - normalRangeMin
  const visualMin = normalRangeMin - rangeSpan * 0.3
  const visualMax = normalRangeMax + rangeSpan * 0.3
  const clampedValue = Math.max(visualMin, Math.min(visualMax, value))
  const position = ((clampedValue - visualMin) / (visualMax - visualMin)) * 100

  // Normal zone boundaries as percentages of the visual range
  const normalStart =
    ((normalRangeMin - visualMin) / (visualMax - visualMin)) * 100
  const normalEnd =
    ((normalRangeMax - visualMin) / (visualMax - visualMin)) * 100

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            {parameterName}
          </h4>
          <Badge variant="outline" className={cn("shrink-0 text-xs", config.badgeClass)}>
            {config.label}
          </Badge>
        </div>

        {/* Value */}
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className={cn("text-2xl font-bold", config.valueClass)}>
            {value}
          </span>
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>

        {/* Range indicator bar */}
        <div className="relative mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            {/* Normal zone */}
            <div
              className="absolute top-0 h-2 rounded-full bg-green-200"
              style={{
                left: `${normalStart}%`,
                width: `${normalEnd - normalStart}%`,
              }}
            />
          </div>
          {/* Value dot */}
          <div
            className={cn(
              "absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow",
              config.barClass
            )}
            style={{ left: `${position}%` }}
          />
        </div>

        {/* Range labels */}
        <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
          <span>{normalRangeMin} {unit}</span>
          <span className="text-center text-[10px]">Rentang Normal</span>
          <span>{normalRangeMax} {unit}</span>
        </div>
      </CardContent>
    </Card>
  )
}
