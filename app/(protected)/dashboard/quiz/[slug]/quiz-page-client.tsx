"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Play, ClipboardList } from "lucide-react"

import { Button } from "@/components/ui/button"
import { QuizStepper } from "@/components/quiz/quiz-stepper"
import { QuizResultDisplay } from "@/components/quiz/quiz-result-display"
import type { Quiz, QuizQuestion } from "@/lib/types"

interface QuizPageClientProps {
  quiz: Quiz
  questions: QuizQuestion[]
}

type QuizState = "intro" | "taking" | "submitting" | "result"

export function QuizPageClient({ quiz, questions }: QuizPageClientProps) {
  const [state, setState] = useState<QuizState>("intro")
  const [result, setResult] = useState<Record<string, unknown> | null>(null)

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
          answers,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit quiz")
      }

      const data = await response.json()
      setResult(data.result)
      setState("result")
    } catch (error) {
      console.error("Error submitting quiz:", error)
      const localResult = calculateLocalResult(questions, answers)
      setResult(localResult)
      setState("result")
    }
  }

  return (
    <AnimatePresence mode="wait">
      {/* Intro Screen */}
      {state === "intro" && (
        <motion.div
          key="intro"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex flex-col items-center text-center"
        >
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#FF6B35]/10">
            <ClipboardList className="h-10 w-10 text-[#FF6B35]" />
          </div>
          <h1 className="mb-3 text-2xl font-bold text-foreground sm:text-3xl">
            {quiz.title}
          </h1>
          {quiz.description && (
            <p className="mb-8 max-w-md text-muted-foreground leading-relaxed">
              {quiz.description}
            </p>
          )}
          <div className="mb-8 text-sm text-muted-foreground">
            {questions.length} pertanyaan
          </div>
          <Button
            size="lg"
            onClick={() => setState("taking")}
            className="gap-2 rounded-xl bg-[#FF6B35] text-white hover:bg-[#FF6B35]/90 px-8"
          >
            <Play className="h-5 w-5" />
            Mulai
          </Button>
        </motion.div>
      )}

      {/* Quiz Stepper */}
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

      {/* Loading / Submitting */}
      {state === "submitting" && (
        <motion.div
          key="submitting"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex min-h-[400px] flex-col items-center justify-center gap-4"
        >
          <Loader2 className="h-10 w-10 animate-spin text-[#FF6B35]" />
          <p className="text-lg font-medium text-foreground">
            Menghitung hasil...
          </p>
          <p className="text-sm text-muted-foreground">
            Mohon tunggu sebentar
          </p>
        </motion.div>
      )}

      {/* Result */}
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
  questions: QuizQuestion[],
  answers: Record<string, string | string[] | number>
): Record<string, unknown> {
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
    recommendations: [],
  }
}
