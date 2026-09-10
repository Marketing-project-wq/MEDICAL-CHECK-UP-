"use client"

import { motion } from "framer-motion"
import {
  BookOpen,
  RefreshCw,
  Save,
  Share2,
  CheckCircle2,
  ArrowRight,
  Calendar,
  Clock,
  Dumbbell,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HealthScoreGauge } from "@/components/mcu/health-score-gauge"

interface QuizResultDisplayProps {
  result: Record<string, unknown>
  quizType: string
  quizTitle: string
  onRetry?: () => void
  onSave?: () => void
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

function getLevelColor(level: string): string {
  switch (level) {
    case "Sangat Baik":
    case "Excellent":
      return "text-green-600 bg-green-50 border-green-200"
    case "Baik":
    case "Good":
      return "text-blue-600 bg-blue-50 border-blue-200"
    case "Cukup":
    case "Fair":
      return "text-yellow-600 bg-yellow-50 border-yellow-200"
    case "Perlu Perbaikan":
    case "Needs Improvement":
      return "text-red-600 bg-red-50 border-red-200"
    default:
      return "text-muted-foreground bg-muted border-border"
  }
}

function getCategoryBarColor(percentage: number): string {
  if (percentage >= 80) return "bg-green-500"
  if (percentage >= 60) return "bg-blue-500"
  if (percentage >= 40) return "bg-yellow-500"
  return "bg-red-500"
}

function AssessmentResult({ result }: { result: Record<string, unknown> }) {
  const score = (result.score as number) || 0
  const maxScore = (result.maxScore as number) || 100
  const percentage = (result.percentage as number) || 0
  const level = (result.level as string) || ""
  const categories =
    (result.categories as Array<{
      name: string
      score: number
      maxScore: number
      percentage: number
    }>) || []
  const recommendations = (result.recommendations as string[]) || []

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Score Gauge */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col items-center gap-4 rounded-2xl border bg-card p-8 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-foreground">Skor Anda</h2>
        <HealthScoreGauge score={Math.round((score / maxScore) * 100)} size="md" />
        <div
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-semibold",
            getLevelColor(level)
          )}
        >
          {level}
        </div>
        <p className="text-sm text-muted-foreground">
          {score} dari {maxScore} poin ({percentage}%)
        </p>
      </motion.div>

      {/* Category Breakdown */}
      {categories.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border bg-card p-6 shadow-sm"
        >
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Rincian per Kategori
          </h3>
          <div className="space-y-4">
            {categories.map((cat) => (
              <div key={cat.name}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {cat.name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {cat.score}/{cat.maxScore} ({cat.percentage}%)
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.percentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                    className={cn(
                      "h-full rounded-full",
                      getCategoryBarColor(cat.percentage)
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border bg-card p-6 shadow-sm"
        >
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Rekomendasi untuk Anda
          </h3>
          <ul className="space-y-3">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[hsl(16,100%,60%)]" />
                <span className="text-sm leading-relaxed text-foreground">
                  {rec}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </motion.div>
  )
}

function PersonalizedPlanResult({
  result,
}: {
  result: Record<string, unknown>
}) {
  const plan = result.plan as Record<string, unknown> | undefined
  const weeklySchedule =
    (plan?.weeklySchedule as Array<{
      day: string
      activities: Array<{ name: string; duration: string; type: string }>
    }>) || []
  const tips = (plan?.tips as string[]) || (result.tips as string[]) || []
  const planTitle =
    (plan?.title as string) || (result.planTitle as string) || "Rencana Anda"
  const planDescription =
    (plan?.description as string) || (result.planDescription as string) || ""

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Plan Header */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl border bg-gradient-to-br from-[hsl(16,100%,60%)]/10 to-[hsl(214,52%,25%)]/10 p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-2">
          <Dumbbell className="h-6 w-6 text-[hsl(16,100%,60%)]" />
          <h2 className="text-xl font-bold text-foreground">{planTitle}</h2>
        </div>
        {planDescription && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {planDescription}
          </p>
        )}
      </motion.div>

      {/* Weekly Schedule */}
      {weeklySchedule.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Calendar className="h-5 w-5 text-[hsl(214,52%,25%)]" />
            Jadwal Mingguan
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {weeklySchedule.map((day) => (
              <div
                key={day.day}
                className="rounded-xl border bg-card p-4 shadow-sm"
              >
                <h4 className="mb-3 font-semibold text-[hsl(214,52%,25%)]">
                  {day.day}
                </h4>
                {day.activities.length > 0 ? (
                  <ul className="space-y-2">
                    {day.activities.map((act, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {act.duration}
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {act.name}
                        </span>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {act.type}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Istirahat
                  </p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Tips */}
      {tips.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border bg-card p-6 shadow-sm"
        >
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Tips & Rekomendasi
          </h3>
          <ul className="space-y-3">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3">
                <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-[hsl(16,100%,60%)]" />
                <span className="text-sm leading-relaxed text-foreground">
                  {tip}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </motion.div>
  )
}

export function QuizResultDisplay({
  result,
  quizType,
  quizTitle,
  onRetry,
  onSave,
}: QuizResultDisplayProps) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-foreground">Hasil: {quizTitle}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Berikut adalah hasil quiz Anda
        </p>
      </motion.div>

      {quizType === "personalized-plan" ? (
        <PersonalizedPlanResult result={result} />
      ) : (
        <AssessmentResult result={result} />
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-8 flex flex-wrap items-center gap-3"
      >
        {onSave && (
          <Button
            onClick={onSave}
            className="gap-2 rounded-xl bg-[hsl(16,100%,60%)] text-white hover:bg-[hsl(16,100%,55%)]"
          >
            <Save className="h-4 w-4" />
            Simpan Hasil
          </Button>
        )}
        {onRetry && (
          <Button variant="outline" onClick={onRetry} className="gap-2 rounded-xl">
            <RefreshCw className="h-4 w-4" />
            Ulangi Quiz
          </Button>
        )}
        <Button variant="outline" className="gap-2 rounded-xl" disabled>
          <Share2 className="h-4 w-4" />
          Bagikan
        </Button>
        <Button variant="ghost" className="gap-2 rounded-xl" asChild>
          <a href="/dashboard/articles">
            <BookOpen className="h-4 w-4" />
            Lihat Artikel Terkait
          </a>
        </Button>
      </motion.div>
    </div>
  )
}
