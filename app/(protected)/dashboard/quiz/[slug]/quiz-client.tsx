"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2 } from "lucide-react"

import { QuizStepper } from "@/components/quiz/quiz-stepper"
import { QuizResultDisplay } from "@/components/quiz/quiz-result-display"
import type { Quiz, QuizQuestion } from "@/lib/types"

interface QuizClientProps {
  quiz: Quiz
  questions: QuizQuestion[]
  userId: string | null
}

type QuizState = "taking" | "submitting" | "result"

export function QuizClient({ quiz, questions, userId }: QuizClientProps) {
  const router = useRouter()
  const [state, setState] = useState<QuizState>("taking")
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleComplete(
    answers: Record<string, string | string[] | number>
  ) {
    setState("submitting")

    try {
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: quiz.id,
          userId,
          answers,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit quiz")
      }

      const data = await response.json()
      setResult(data.result)
      setSaved(true)
      setState("result")
    } catch (error) {
      console.error("Error submitting quiz:", error)
      // Still show result locally if API fails
      const localResult = calculateLocalResult(quiz, questions, answers)
      setResult(localResult)
      setSaved(false)
      setState("result")
    }
  }

  function handleRetry() {
    setState("taking")
    setResult(null)
    setSaved(false)
  }

  async function handleSave() {
    if (saved || !result || !userId) return

    try {
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: quiz.id,
          userId,
          answers: {},
          result,
        }),
      })

      if (response.ok) {
        setSaved(true)
      }
    } catch (error) {
      console.error("Error saving result:", error)
    }
  }

  return (
    <AnimatePresence mode="wait">
      {state === "submitting" && (
        <motion.div
          key="submitting"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex min-h-[400px] flex-col items-center justify-center gap-4"
        >
          <Loader2 className="h-10 w-10 animate-spin text-[hsl(16,100%,60%)]" />
          <p className="text-lg font-medium text-foreground">
            Menghitung hasil...
          </p>
          <p className="text-sm text-muted-foreground">
            Mohon tunggu sebentar
          </p>
        </motion.div>
      )}

      {state === "taking" && (
        <motion.div
          key="taking"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <QuizStepper
            questions={questions}
            onComplete={handleComplete}
            quizTitle={quiz.title}
          />
        </motion.div>
      )}

      {state === "result" && result && (
        <motion.div
          key="result"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <QuizResultDisplay
            result={result}
            quizType={quiz.quiz_type}
            quizTitle={quiz.title}
            onRetry={handleRetry}
            onSave={!saved ? handleSave : undefined}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Local fallback calculation when the API is unreachable.
 */
function calculateLocalResult(
  quiz: Quiz,
  questions: QuizQuestion[],
  answers: Record<string, string | string[] | number>
): Record<string, unknown> {
  if (quiz.quiz_type === "assessment" || quiz.quiz_type === "knowledge-test") {
    let totalScore = 0
    let maxPossible = 0

    for (const q of questions) {
      if (!q.options) continue

      const answer = answers[q.id]
      const maxOptionScore = Math.max(...q.options.map((o) => o.score ?? 0))
      maxPossible += maxOptionScore

      if (q.question_type === "single_choice" && typeof answer === "string") {
        const selected = q.options.find((o) => o.value === answer)
        totalScore += selected?.score ?? 0
      } else if (
        q.question_type === "multiple_choice" &&
        Array.isArray(answer)
      ) {
        for (const val of answer) {
          const selected = q.options.find((o) => o.value === val)
          totalScore += selected?.score ?? 0
        }
      } else if (q.question_type === "scale" && typeof answer === "number") {
        totalScore += answer
        // For scale, maxPossible is already counted from maxOptionScore
      }
    }

    const percentage =
      maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0

    let level: string
    if (percentage >= 80) level = "Sangat Baik"
    else if (percentage >= 60) level = "Baik"
    else if (percentage >= 40) level = "Cukup"
    else level = "Perlu Perbaikan"

    return {
      score: totalScore,
      maxScore: maxPossible,
      percentage,
      level,
      categories: [],
      recommendations: [],
    }
  }

  // personalized-plan fallback
  return {
    plan: {
      title: "Rencana Personal Anda",
      description:
        "Berdasarkan jawaban Anda, berikut rencana yang disarankan.",
      weeklySchedule: [],
      tips: [
        "Konsultasikan dengan profesional kesehatan untuk rencana yang lebih detail.",
      ],
    },
  }
}
