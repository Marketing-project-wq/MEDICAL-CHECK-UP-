import { createClient } from "@/lib/supabase/server"
import { ArticleCard } from "@/components/articles/article-card"
import { ArticlesListClient } from "@/components/articles/articles-list-client"
import { BookOpen, Sparkles } from "lucide-react"
import type { Article, MCUResult } from "@/lib/types"

/**
 * Determine article categories to recommend based on abnormal MCU results.
 */
function getRecommendedCategories(results: MCUResult[]): string[] {
  const categories = new Set<string>()

  for (const r of results) {
    if (r.status === "warning" || r.status === "critical") {
      const cat = r.category.toLowerCase()
      const param = r.parameter_name.toLowerCase()

      // Cholesterol / lipid related -> nutrisi
      if (
        cat.includes("lipid") ||
        cat.includes("kolesterol") ||
        cat.includes("cholesterol") ||
        param.includes("cholesterol") ||
        param.includes("kolesterol") ||
        param.includes("ldl") ||
        param.includes("hdl") ||
        param.includes("triglycerid")
      ) {
        categories.add("nutrisi")
      }

      // BMI / weight related -> olahraga
      if (
        cat.includes("bmi") ||
        cat.includes("anthropomet") ||
        param.includes("bmi") ||
        param.includes("berat") ||
        param.includes("weight") ||
        param.includes("body mass")
      ) {
        categories.add("olahraga")
      }

      // Blood sugar / glucose -> nutrisi
      if (
        param.includes("glukosa") ||
        param.includes("glucose") ||
        param.includes("gula darah") ||
        param.includes("hba1c")
      ) {
        categories.add("nutrisi")
      }

      // Blood pressure -> olahraga & nutrisi
      if (
        param.includes("tekanan darah") ||
        param.includes("blood pressure") ||
        param.includes("sistol") ||
        param.includes("diastol")
      ) {
        categories.add("olahraga")
        categories.add("nutrisi")
      }

      // Sleep related -> tidur
      if (
        cat.includes("tidur") ||
        cat.includes("sleep") ||
        param.includes("tidur") ||
        param.includes("sleep")
      ) {
        categories.add("tidur")
      }

      // Mental / stress related -> mental health
      if (
        cat.includes("mental") ||
        cat.includes("psikolog") ||
        param.includes("stress") ||
        param.includes("depresi") ||
        param.includes("anxi")
      ) {
        categories.add("mental health")
      }
    }
  }

  return Array.from(categories)
}

export default async function DashboardArticlesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch all articles
  const { data: articles } = await supabase
    .from("articles")
    .select("*")
    .order("published_at", { ascending: false })

  const allArticles: Article[] = (articles as Article[]) ?? []

  // Fetch user's MCU results for recommendation logic
  let recommendedArticles: Article[] = []

  if (user) {
    const { data: mcuResults } = await supabase
      .from("mcu_results")
      .select("*")
      .eq("user_id", user.id)

    const results: MCUResult[] = (mcuResults as MCUResult[]) ?? []
    const recommendedCategories = getRecommendedCategories(results)

    if (recommendedCategories.length > 0) {
      recommendedArticles = allArticles
        .filter((a) =>
          recommendedCategories.includes(a.category.toLowerCase())
        )
        .slice(0, 6)
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-7 w-7 text-[#FF6B35]" />
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Artikel Kesehatan
          </h1>
        </div>
        <p className="text-muted-foreground">
          Baca artikel terbaru tentang kesehatan, nutrisi, olahraga, dan gaya
          hidup sehat.
        </p>
      </div>

      {/* Recommendations Section */}
      {recommendedArticles.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-[#FF6B35]" />
            <h2 className="text-xl font-semibold text-foreground">
              Rekomendasi untuk Kamu
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Berdasarkan hasil medical check-up Anda, artikel berikut mungkin
            berguna.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedArticles.map((article) => (
              <ArticleCard
                key={article.id}
                title={article.title}
                slug={article.slug}
                excerpt={article.excerpt}
                cover_image_url={article.cover_image_url}
                category={article.category}
                read_time_minutes={article.read_time_minutes}
                is_premium={article.is_premium}
                author={article.author}
                published_at={article.published_at}
              />
            ))}
          </div>
        </section>
      )}

      {/* Full Articles List with Category Filter Tabs */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Semua Artikel
        </h2>
        <ArticlesListClient articles={allArticles} />
      </section>
    </div>
  )
}
