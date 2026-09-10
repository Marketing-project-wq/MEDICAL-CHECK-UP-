"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Send } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import type { QuizQuestion } from "@/lib/types"

interface QuizStepperProps {
  questions: QuizQuestion[]
  onComplete: (answers: Record<string, any>) => void
  quizTitle: string
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
}

export function QuizStepper({
  questions,
  onComplete,
  quizTitle,
}: QuizStepperProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [direction, setDirection] = useState(1)

  const currentQuestion = questions[currentStep]
  const isLastStep = currentStep === questions.length - 1
  const progressValue = ((currentStep + 1) / questions.length) * 100

  const currentAnswer = answers[currentQuestion.id]
  const isAnswered = (() => {
    if (!currentQuestion.is_required) return true
    if (currentAnswer === undefined || currentAnswer === null) return false
    if (typeof currentAnswer === "string") return currentAnswer.trim() !== ""
    if (Array.isArray(currentAnswer)) return currentAnswer.length > 0
    return true
  })()

  const handleSingleChoice = useCallback(
    (value: string) => {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }))
    },
    [currentQuestion.id]
  )

  const handleMultipleChoice = useCallback(
    (value: string, checked: boolean) => {
      setAnswers((prev) => {
        const existing = (prev[currentQuestion.id] as string[]) || []
        if (checked) {
          return { ...prev, [currentQuestion.id]: [...existing, value] }
        }
        return {
          ...prev,
          [currentQuestion.id]: existing.filter((v) => v !== value),
        }
      })
    },
    [currentQuestion.id]
  )

  const handleScale = useCallback(
    (value: number) => {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }))
    },
    [currentQuestion.id]
  )

  const handleTextInput = useCallback(
    (value: string) => {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }))
    },
    [currentQuestion.id]
  )

  function handleNext() {
    if (isLastStep) {
      onComplete(answers)
    } else {
      setDirection(1)
      setCurrentStep((prev) => prev + 1)
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setDirection(-1)
      setCurrentStep((prev) => prev - 1)
    }
  }

  function renderScaleOptions() {
    const options = currentQuestion.options
    if (options && options.length > 0) {
      return (
        <div className="flex flex-wrap justify-center gap-3">
          {options.map((opt) => {
            const numValue = parseInt(opt.value, 10)
            const isSelected = currentAnswer === numValue
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleScale(numValue)}
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-xl border-2 text-lg font-semibold transition-all duration-200",
                  isSelected
                    ? "border-[#FF6B35] bg-[#FF6B35] text-white shadow-lg scale-110"
                    : "border-border bg-card text-foreground hover:border-[#FF6B35]/50 hover:bg-accent"
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      )
    }

    // Default 1-5 scale
    const scaleMax = 5
    return (
      <div className="flex flex-wrap justify-center gap-3">
        {Array.from({ length: scaleMax }, (_, i) => i + 1).map((num) => {
          const isSelected = currentAnswer === num
          return (
            <button
              key={num}
              type="button"
              onClick={() => handleScale(num)}
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-xl border-2 text-lg font-semibold transition-all duration-200",
                isSelected
                  ? "border-[#FF6B35] bg-[#FF6B35] text-white shadow-lg scale-110"
                  : "border-border bg-card text-foreground hover:border-[#FF6B35]/50 hover:bg-accent"
              )}
            >
              {num}
            </button>
          )
        })}
      </div>
    )
  }

  function renderQuestion() {
    switch (currentQuestion.question_type) {
      case "single_choice":
        return (
          <div className="grid gap-3">
            {currentQuestion.options?.map((option) => {
              const isSelected = currentAnswer === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSingleChoice(option.value)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200",
                    isSelected
                      ? "border-[#FF6B35] bg-[#FF6B35]/5 shadow-md"
                      : "border-border bg-card hover:border-[#FF6B35]/40 hover:bg-accent/50"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      isSelected
                        ? "border-[#FF6B35] bg-[#FF6B35]"
                        : "border-muted-foreground/40"
                    )}
                  >
                    {isSelected && (
                      <div className="h-2.5 w-2.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-sm font-medium leading-relaxed">
                    {option.label}
                  </span>
                </button>
              )
            })}
          </div>
        )

      case "multiple_choice":
        return (
          <div className="grid gap-3">
            {currentQuestion.options?.map((option) => {
              const selected = Array.isArray(currentAnswer)
                ? currentAnswer.includes(option.value)
                : false
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleMultipleChoice(option.value, !selected)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200",
                    selected
                      ? "border-[#FF6B35] bg-[#FF6B35]/5 shadow-md"
                      : "border-border bg-card hover:border-[#FF6B35]/40 hover:bg-accent/50"
                  )}
                >
                  <Checkbox
                    checked={selected}
                    onCheckedChange={(checked) =>
                      handleMultipleChoice(option.value, checked === true)
                    }
                    className="pointer-events-none"
                  />
                  <span className="text-sm font-medium leading-relaxed">
                    {option.label}
                  </span>
                </button>
              )
            })}
          </div>
        )

      case "scale":
        return renderScaleOptions()

      case "text_input":
        return (
          <Textarea
            value={(currentAnswer as string) || ""}
            onChange={(e) => handleTextInput(e.target.value)}
            placeholder="Ketik jawaban Anda di sini..."
            className="min-h-[120px] rounded-xl border-2 text-base focus:border-[#FF6B35]"
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-4 text-2xl font-bold text-foreground">{quizTitle}</h1>
        <div className="flex items-center gap-3">
          <Progress value={progressValue} className="h-2.5 flex-1" />
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            {currentStep + 1} / {questions.length}
          </span>
        </div>
      </div>

      {/* Question */}
      <div className="relative min-h-[400px] overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full"
          >
            <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
              <div className="mb-2 text-sm font-medium text-[#FF6B35]">
                Pertanyaan {currentStep + 1}
              </div>
              <h2 className="mb-6 text-lg font-semibold leading-relaxed text-foreground sm:text-xl">
                {currentQuestion.question_text}
              </h2>
              <div className="space-y-2">{renderQuestion()}</div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="gap-2 rounded-xl"
        >
          <ChevronLeft className="h-4 w-4" />
          Kembali
        </Button>

        <Button
          onClick={handleNext}
          disabled={!isAnswered}
          className="gap-2 rounded-xl bg-[#FF6B35] text-white hover:bg-[#FF6B35]/90"
        >
          {isLastStep ? (
            <>
              Kirim
              <Send className="h-4 w-4" />
            </>
          ) : (
            <>
              Lanjut
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
