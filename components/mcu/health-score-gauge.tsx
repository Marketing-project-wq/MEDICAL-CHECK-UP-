"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface HealthScoreGaugeProps {
  score: number
  label?: string
  size?: "sm" | "md" | "lg"
}

const SIZE_CONFIG = {
  sm: { dimension: 120, strokeWidth: 8, fontSize: "text-xl", labelSize: "text-xs" },
  md: { dimension: 160, strokeWidth: 10, fontSize: "text-3xl", labelSize: "text-sm" },
  lg: { dimension: 200, strokeWidth: 12, fontSize: "text-4xl", labelSize: "text-base" },
} as const

function getScoreColor(score: number): string {
  if (score < 40) return "#ef4444"  // red-500
  if (score < 70) return "#eab308"  // yellow-500
  return "#22c55e"                   // green-500
}

function getScoreLabel(score: number): string {
  if (score < 40) return "Perlu Perhatian"
  if (score < 70) return "Cukup Baik"
  return "Baik"
}

export function HealthScoreGauge({
  score,
  label,
  size = "md",
}: HealthScoreGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score))
  const config = SIZE_CONFIG[size]
  const radius = (config.dimension - config.strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (clampedScore / 100) * circumference
  const center = config.dimension / 2
  const color = getScoreColor(clampedScore)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: config.dimension, height: config.dimension }}>
        <svg
          width={config.dimension}
          height={config.dimension}
          viewBox={`0 0 ${config.dimension} ${config.dimension}`}
          className="-rotate-90"
        >
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={config.strokeWidth}
          />
          {/* Progress arc */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={cn("font-bold", config.fontSize)}
            style={{ color }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {clampedScore}
          </motion.span>
          <span className={cn("text-muted-foreground", config.labelSize)}>
            {getScoreLabel(clampedScore)}
          </span>
        </div>
      </div>

      {label && (
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      )}
    </div>
  )
}
