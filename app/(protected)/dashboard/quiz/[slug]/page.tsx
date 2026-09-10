import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Quiz, QuizQuestion } from "@/lib/types"
import { QuizClient } from "./quiz-client"

interface QuizPageProps {
  params: { slug: string }
}

export default async function QuizPage({ params }: QuizPageProps) {
  const supabase = await createClient()

  // Fetch quiz by slug
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("*")
    .eq("slug", params.slug)
    .eq("is_active", true)
    .single()

  if (quizError || !quiz) {
    notFound()
  }

  // Fetch questions ordered by order_index
  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("quiz_id", quiz.id)
    .order("order_index", { ascending: true })

  if (!questions || questions.length === 0) {
    notFound()
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <QuizClient
        quiz={quiz as Quiz}
        questions={questions as QuizQuestion[]}
        userId={user?.id || null}
      />
    </div>
  )
}
