import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { QuizQuestion } from "@/lib/types"

interface SubmitBody {
  quizId: string
  answers: Record<string, string | string[] | number>
}

export async function POST(request: NextRequest) {
  try {
    const body: SubmitBody = await request.json()
    const { quizId, answers } = body

    if (!quizId) {
      return NextResponse.json(
        { error: "quizId is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Fetch quiz
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", quizId)
      .single()

    if (quizError || !quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    // Fetch questions
    const { data: questions } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", quizId)
      .order("order_index", { ascending: true })

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: "No questions found for this quiz" },
        { status: 404 }
      )
    }

    const typedQuestions = questions as QuizQuestion[]

    let result: Record<string, unknown>

    switch (quiz.quiz_type) {
      case "assessment":
      case "knowledge-test":
        result = calculateAssessmentResult(typedQuestions, answers)
        break
      case "personalized-plan":
        result = generatePersonalizedPlan(typedQuestions, answers)
        break
      default:
        result = calculateAssessmentResult(typedQuestions, answers)
    }

    // Insert quiz response
    const { error: insertError } = await supabase
      .from("quiz_responses")
      .insert({
        quiz_id: quizId,
        user_id: user.id,
        answers,
        result,
      })

    if (insertError) {
      console.error("Error saving quiz response:", insertError)
    }

    return NextResponse.json({ result })
  } catch (error) {
    console.error("Quiz submission error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * Calculate assessment results: total score, percentage, level, recommendations.
 */
function calculateAssessmentResult(
  questions: QuizQuestion[],
  answers: Record<string, string | string[] | number>
): Record<string, unknown> {
  let totalScore = 0
  let maxPossible = 0

  for (const question of questions) {
    const answer = answers[question.id]
    const options = question.options || []

    // Calculate max possible score for this question
    let questionMaxScore = 0
    if (question.question_type === "scale") {
      if (options.length > 0) {
        questionMaxScore = Math.max(
          ...options.map((o) => (o.score ?? parseInt(o.value, 10)) || 0)
        )
      } else {
        questionMaxScore = 5
      }
    } else if (options.length > 0) {
      if (question.question_type === "multiple_choice") {
        questionMaxScore = options.reduce(
          (sum, o) => sum + Math.max(o.score ?? 0, 0),
          0
        )
      } else {
        questionMaxScore = Math.max(...options.map((o) => o.score ?? 0))
      }
    }

    maxPossible += questionMaxScore

    // Calculate actual score
    let questionScore = 0

    if (
      question.question_type === "single_choice" &&
      typeof answer === "string"
    ) {
      const selected = options.find((o) => o.value === answer)
      questionScore = selected?.score ?? 0
    } else if (
      question.question_type === "multiple_choice" &&
      Array.isArray(answer)
    ) {
      for (const val of answer) {
        const selected = options.find((o) => o.value === val)
        questionScore += selected?.score ?? 0
      }
    } else if (question.question_type === "scale" && typeof answer === "number") {
      questionScore = answer
    }
    // text_input questions don't contribute to score

    totalScore += questionScore
  }

  const percentage =
    maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0

  let level: string
  if (percentage >= 80) level = "Sangat Baik"
  else if (percentage >= 60) level = "Baik"
  else if (percentage >= 40) level = "Cukup"
  else level = "Perlu Perbaikan"

  // Generate recommendations based on level
  const recommendations = generateRecommendations(level, percentage)

  return {
    score: totalScore,
    maxScore: maxPossible,
    percentage,
    level,
    recommendations,
  }
}

/**
 * Generate a personalized plan based on quiz answers.
 */
function generatePersonalizedPlan(
  questions: QuizQuestion[],
  answers: Record<string, string | string[] | number>
): Record<string, unknown> {
  let fitnessLevel: "beginner" | "intermediate" | "advanced" = "beginner"
  let availableDays = 3

  for (const question of questions) {
    const answer = answers[question.id]
    const questionLower = question.question_text.toLowerCase()

    if (typeof answer === "number") {
      if (
        questionLower.includes("frekuensi") ||
        questionLower.includes("sering") ||
        questionLower.includes("aktif")
      ) {
        if (answer >= 4) fitnessLevel = "advanced"
        else if (answer >= 3) fitnessLevel = "intermediate"
      }
      if (
        questionLower.includes("hari") ||
        questionLower.includes("waktu")
      ) {
        availableDays = Math.max(2, Math.min(answer, 7))
      }
    }
  }

  const days = [
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
    "Minggu",
  ]

  const exerciseTemplates: Record<
    string,
    Array<{ name: string; duration: string; type: string }>
  > = {
    beginner: [
      { name: "Jalan Cepat", duration: "20 menit", type: "Kardio" },
      { name: "Stretching", duration: "10 menit", type: "Fleksibilitas" },
      { name: "Bodyweight Squat", duration: "10 menit", type: "Kekuatan" },
    ],
    intermediate: [
      { name: "Jogging", duration: "30 menit", type: "Kardio" },
      { name: "Circuit Training", duration: "25 menit", type: "Kekuatan" },
      { name: "Plank & Core", duration: "15 menit", type: "Kekuatan" },
      { name: "HIIT Ringan", duration: "20 menit", type: "Kardio" },
    ],
    advanced: [
      { name: "Lari Interval", duration: "40 menit", type: "Kardio" },
      { name: "Weight Training", duration: "45 menit", type: "Kekuatan" },
      { name: "HIIT Intensif", duration: "30 menit", type: "Kardio" },
      { name: "Core & Abs", duration: "20 menit", type: "Kekuatan" },
    ],
  }

  const exercises = exerciseTemplates[fitnessLevel]
  const weeklySchedule = days.map((day, index) => {
    if (index < availableDays) {
      const startIdx = (index * 2) % exercises.length
      const dayExercises = [
        exercises[startIdx % exercises.length],
        exercises[(startIdx + 1) % exercises.length],
      ]
      return { day, activities: dayExercises }
    }
    return { day, activities: [] }
  })

  const levelLabels = {
    beginner: "Pemula",
    intermediate: "Menengah",
    advanced: "Lanjutan",
  }

  const tips = [
    `Program ini disesuaikan untuk level ${levelLabels[fitnessLevel]}.`,
    `Targetkan ${availableDays} hari latihan per minggu.`,
    "Selalu lakukan pemanasan 5-10 menit sebelum latihan.",
    "Minum air putih yang cukup sebelum, selama, dan setelah berolahraga.",
    "Dengarkan tubuh Anda -- istirahat jika merasa nyeri atau kelelahan berlebih.",
    "Tingkatkan intensitas secara bertahap setiap 2-3 minggu.",
    "Kombinasikan dengan pola makan seimbang untuk hasil optimal.",
  ]

  return {
    plan: {
      title: `Program Latihan ${levelLabels[fitnessLevel]}`,
      description: `Rencana latihan ${availableDays} hari/minggu yang disesuaikan dengan tingkat kebugaran Anda.`,
      fitnessLevel,
      weeklySchedule,
      tips,
    },
    tips,
  }
}

/**
 * Generate recommendations based on level and percentage.
 */
function generateRecommendations(
  level: string,
  percentage: number
): string[] {
  const recommendations: string[] = []

  switch (level) {
    case "Sangat Baik":
      recommendations.push(
        "Kondisi kesehatan Anda sangat baik! Pertahankan pola hidup sehat Anda."
      )
      recommendations.push(
        "Lakukan medical check-up rutin untuk memastikan kesehatan tetap terjaga."
      )
      recommendations.push(
        "Tetap konsisten dengan gaya hidup sehat dan jadilah inspirasi bagi orang di sekitar Anda."
      )
      break
    case "Baik":
      recommendations.push(
        "Kondisi kesehatan Anda cukup baik. Ada beberapa area yang bisa ditingkatkan."
      )
      recommendations.push(
        "Pertimbangkan untuk meningkatkan frekuensi olahraga atau memperbaiki pola makan."
      )
      recommendations.push(
        "Perhatikan kualitas tidur dan kelola stres dengan baik."
      )
      break
    case "Cukup":
      recommendations.push(
        "Beberapa aspek kesehatan Anda memerlukan perhatian. Mulailah dengan perubahan kecil."
      )
      recommendations.push(
        "Cobalah berolahraga minimal 30 menit sehari, 3-5 kali seminggu."
      )
      recommendations.push(
        "Perbanyak konsumsi sayur dan buah, serta kurangi makanan olahan."
      )
      recommendations.push(
        "Konsultasikan dengan profesional kesehatan untuk panduan yang lebih spesifik."
      )
      break
    case "Perlu Perbaikan":
      recommendations.push(
        "Kesehatan Anda memerlukan perbaikan segera. Konsultasikan dengan dokter atau ahli kesehatan."
      )
      recommendations.push(
        "Mulai dengan perubahan kecil: minum air putih lebih banyak, jalan kaki setiap hari."
      )
      recommendations.push(
        "Hindari kebiasaan yang merugikan kesehatan seperti merokok dan kurang tidur."
      )
      recommendations.push(
        "Jadwalkan medical check-up lengkap untuk evaluasi menyeluruh."
      )
      recommendations.push(
        "Pertimbangkan untuk bergabung dengan program kesehatan atau komunitas olahraga."
      )
      break
  }

  return recommendations
}
