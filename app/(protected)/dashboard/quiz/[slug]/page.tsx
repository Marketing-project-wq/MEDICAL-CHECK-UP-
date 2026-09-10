import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Quiz, QuizQuestion } from "@/lib/types"
import { QuizPageClient } from "./quiz-page-client"

type Params = { slug: string }

export default async function QuizSlugPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch quiz by slug
  const { data: quiz, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (error || !quiz) {
    notFound()
  }

  const typedQuiz = quiz as Quiz

  // Fetch questions ordered by order_index
  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("quiz_id", typedQuiz.id)
    .order("order_index", { ascending: true })

  const typedQuestions = (questions as QuizQuestion[]) || []

  if (typedQuestions.length === 0) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <QuizPageClient quiz={typedQuiz} questions={typedQuestions} />
    </div>
  )
}
