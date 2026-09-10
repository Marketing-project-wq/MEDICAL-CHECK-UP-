"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Send } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import type { QuizQuestion } from "@/lib/types"

interface QuizStepperProps {
  questions: QuizQuestion[]
  onComplete: (answers: Record<string, string | string[] | number>) => void
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
  const [answers, setAnswers] = useState<
    Record<string, string | string[] | number>
  >({})
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
                    ? "border-[hsl(16,100%,60%)] bg-[hsl(16,100%,60%)] text-white shadow-lg scale-110"
                    : "border-border bg-card text-foreground hover:border-[hsl(16,100%,60%)]/50 hover:bg-accent"
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
                  ? "border-[hsl(16,100%,60%)] bg-[hsl(16,100%,60%)] text-white shadow-lg scale-110"
                  : "border-border bg-card text-foreground hover:border-[hsl(16,100%,60%)]/50 hover:bg-accent"
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
          <RadioGroup
            value={(currentAnswer as string) || ""}
            onValueChange={handleSingleChoice}
            className="grid gap-3"
          >
            {currentQuestion.options?.map((option) => (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all duration-200",
                  currentAnswer === option.value
                    ? "border-[hsl(16,100%,60%)] bg-[hsl(16,100%,60%)]/5 shadow-md"
                    : "border-border bg-card hover:border-[hsl(16,100%,60%)]/40 hover:bg-accent/50"
                )}
              >
                <RadioGroupItem value={option.value} />
                <span className="text-sm font-medium leading-relaxed">
                  {option.label}
                </span>
              </label>
            ))}
          </RadioGroup>
        )

      case "multiple_choice":
        return (
          <div className="grid gap-3">
            {currentQuestion.options?.map((option) => {
              const selected = Array.isArray(currentAnswer)
                ? currentAnswer.includes(option.value)
                : false
              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all duration-200",
                    selected
                      ? "border-[hsl(16,100%,60%)] bg-[hsl(16,100%,60%)]/5 shadow-md"
                      : "border-border bg-card hover:border-[hsl(16,100%,60%)]/40 hover:bg-accent/50"
                  )}
                >
                  <Checkbox
                    checked={selected}
                    onCheckedChange={(checked) =>
                      handleMultipleChoice(option.value, checked === true)
                    }
                  />
                  <span className="text-sm font-medium leading-relaxed">
                    {option.label}
                  </span>
                </label>
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
            className="min-h-[120px] rounded-xl border-2 text-base focus:border-[hsl(16,100%,60%)]"
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
              <div className="mb-2 text-sm font-medium text-[hsl(16,100%,60%)]">
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
          className="gap-2 rounded-xl bg-[hsl(16,100%,60%)] text-white hover:bg-[hsl(16,100%,55%)]"
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
