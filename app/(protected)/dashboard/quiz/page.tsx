import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ClipboardList, Trophy, Calendar, ArrowRight } from "lucide-react"
import type { Quiz, QuizResponse } from "@/lib/types"

const categoryGradients: Record<string, string> = {
  exercise: "from-orange-400/20 to-amber-600/20 border-orange-200",
  olahraga: "from-orange-400/20 to-amber-600/20 border-orange-200",
  nutrition: "from-green-400/20 to-emerald-600/20 border-green-200",
  nutrisi: "from-green-400/20 to-emerald-600/20 border-green-200",
  sleep: "from-indigo-400/20 to-blue-600/20 border-indigo-200",
  tidur: "from-indigo-400/20 to-blue-600/20 border-indigo-200",
  "mental-health": "from-purple-400/20 to-violet-600/20 border-purple-200",
  mental: "from-purple-400/20 to-violet-600/20 border-purple-200",
  "mental health": "from-purple-400/20 to-violet-600/20 border-purple-200",
  kesehatan: "from-green-400/20 to-emerald-600/20 border-green-200",
}

const defaultGradient =
  "from-[#FF6B35]/10 to-[#1E3A5F]/10 border-border"

function getQuizTypeBadge(quizType: string) {
  switch (quizType) {
    case "assessment":
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
          Assessment
        </Badge>
      )
    case "personalized-plan":
      return (
        <Badge className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100">
          Personalized Plan
        </Badge>
      )
    case "knowledge-test":
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
          Knowledge Test
        </Badge>
      )
    default:
      return <Badge variant="secondary">{quizType}</Badge>
  }
}

function getCategoryGradient(category: string) {
  const key = category.toLowerCase()
  return categoryGradients[key] || defaultGradient
}

export default async function QuizListPage() {
  const supabase = await createClient()

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let responses: (QuizResponse & { quiz?: Quiz })[] = []
  if (user) {
    const { data: userResponses } = await supabase
      .from("quiz_responses")
      .select("*, quiz:quizzes(*)")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(10)

    if (userResponses) {
      responses = userResponses as (QuizResponse & { quiz?: Quiz })[]
    }
  }

  const quizList = (quizzes as Quiz[]) || []

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <ClipboardList className="h-7 w-7 text-[#FF6B35]" />
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Quiz Kesehatan
          </h1>
        </div>
        <p className="text-muted-foreground">
          Ikuti quiz untuk mengetahui kondisi kesehatan Anda dan dapatkan
          rekomendasi yang dipersonalisasi.
        </p>
      </div>

      {/* Quiz Grid */}
      {quizList.length > 0 ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
          {quizList.map((quiz) => (
            <Card
              key={quiz.id}
              className="group overflow-hidden transition-shadow hover:shadow-lg"
            >
              {/* Cover / Gradient Placeholder */}
              <div
                className={`h-32 bg-gradient-to-br ${getCategoryGradient(quiz.category)} flex items-center justify-center`}
              >
                {quiz.cover_image_url ? (
                  <img
                    src={quiz.cover_image_url}
                    alt={quiz.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ClipboardList className="h-12 w-12 text-muted-foreground/40" />
                )}
              </div>

              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs capitalize">
                    {quiz.category}
                  </Badge>
                  {getQuizTypeBadge(quiz.quiz_type)}
                </div>
                <CardTitle className="text-lg leading-tight">
                  {quiz.title}
                </CardTitle>
                {quiz.description && (
                  <CardDescription className="line-clamp-2">
                    {quiz.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardFooter className="pt-0">
                <Button
                  asChild
                  className="w-full gap-2 rounded-xl bg-[#FF6B35] text-white hover:bg-[#FF6B35]/90"
                >
                  <Link href={`/dashboard/quiz/${quiz.slug}`}>
                    Mulai Quiz
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/30 py-16">
          <ClipboardList className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">
            Belum ada quiz tersedia
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Quiz akan segera ditambahkan.
          </p>
        </div>
      )}

      {/* Past Responses */}
      {responses.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="h-6 w-6 text-[#FF6B35]" />
            <h2 className="text-2xl font-bold text-foreground">Riwayat Quiz</h2>
          </div>
          <div className="space-y-3">
            {responses.map((resp) => {
              const result = resp.result || {}
              const level = (result.level as string) || ""
              const percentage = (result.percentage as number) || null

              return (
                <div
                  key={resp.id}
                  className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      {(resp.quiz as Quiz | undefined)?.title || "Quiz"}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {new Date(resp.completed_at).toLocaleDateString(
                          "id-ID",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </span>
                      {percentage !== null && (
                        <>
                          <span className="text-border">|</span>
                          <span>Skor: {percentage}%</span>
                        </>
                      )}
                    </div>
                  </div>
                  {level && (
                    <Badge variant="outline" className="w-fit">
                      {level}
                    </Badge>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
