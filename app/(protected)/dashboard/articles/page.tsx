import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase"
import { getUser } from "@/lib/auth"
import { DashboardArticlesClient } from "@/components/articles/dashboard-articles-client"
import type { Article, MCUResult } from "@/lib/types"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Artikel Kesehatan | Dashboard | MCU My20Fit",
  description: "Baca semua artikel kesehatan termasuk konten premium.",
}

/**
 * Simple recommendation engine:
 * - Maps abnormal MCU result categories to article categories.
 * - Returns a deduplicated list of recommended articles (max 6).
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
  const user = await getUser()
  if (!user) {
    redirect("/login")
  }

  const supabase = await createServerClient()

  // Fetch all articles (user is authenticated, full access including premium)
  const { data: articles, error: articlesError } = await supabase
    .from("articles")
    .select("*")
    .order("published_at", { ascending: false })

  if (articlesError) {
    console.error("Error fetching articles:", articlesError.message)
  }

  const allArticles: Article[] = (articles as Article[]) ?? []

  // Fetch user's MCU results for recommendations
  const { data: mcuResults } = await supabase
    .from("mcu_results")
    .select("*")
    .eq("user_id", user.id)

  const results: MCUResult[] = (mcuResults as MCUResult[]) ?? []
  const recommendedCategories = getRecommendedCategories(results)

  // Filter articles that match recommended categories (max 6)
  let recommendedArticles: Article[] = []
  if (recommendedCategories.length > 0) {
    recommendedArticles = allArticles
      .filter((a) =>
        recommendedCategories.includes(a.category.toLowerCase())
      )
      .slice(0, 6)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Artikel Kesehatan
        </h1>
        <p className="text-muted-foreground mt-2">
          Baca semua artikel termasuk konten premium untuk mendukung perjalanan
          kesehatan Anda.
        </p>
      </div>

      <DashboardArticlesClient
        articles={allArticles}
        recommendedArticles={recommendedArticles}
      />
    </div>
  )
}
