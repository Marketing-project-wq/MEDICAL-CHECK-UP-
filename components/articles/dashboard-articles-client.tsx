"use client"

import { useState, useMemo } from "react"
import { Search, FileText, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArticleCardWithBookmark } from "@/components/articles/article-card-with-bookmark"
import type { Article } from "@/lib/types"

const CATEGORIES = [
  { value: "semua", label: "Semua" },
  { value: "nutrisi", label: "Nutrisi" },
  { value: "olahraga", label: "Olahraga" },
  { value: "mental health", label: "Mental Health" },
  { value: "tidur", label: "Tidur" },
]

type DashboardArticlesClientProps = {
  articles: Article[]
  recommendedArticles: Article[]
}

export function DashboardArticlesClient({
  articles,
  recommendedArticles,
}: DashboardArticlesClientProps) {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("semua")

  const filtered = useMemo(() => {
    let result = articles

    if (activeCategory !== "semua") {
      result = result.filter(
        (a) => a.category.toLowerCase() === activeCategory
      )
    }

    const q = search.trim().toLowerCase()
    if (q) {
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.excerpt ?? "").toLowerCase().includes(q) ||
          a.author.toLowerCase().includes(q) ||
          (a.tags ?? []).some((t) => t.toLowerCase().includes(q))
      )
    }

    return result
  }, [articles, activeCategory, search])

  return (
    <div>
      {/* Recommended articles section */}
      {recommendedArticles.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Rekomendasi untuk Kamu</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedArticles.map((article) => (
              <ArticleCardWithBookmark
                key={article.id}
                id={article.id}
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

      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Cari artikel..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category filter tabs */}
      <Tabs
        value={activeCategory}
        onValueChange={setActiveCategory}
        className="mb-8"
      >
        <TabsList className="flex flex-wrap h-auto gap-1">
          {CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.value} value={cat.value} className="text-xs sm:text-sm">
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* All articles grid */}
      <h2 className="text-lg font-semibold mb-4">Semua Artikel</h2>
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((article) => (
            <ArticleCardWithBookmark
              key={article.id}
              id={article.id}
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
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileText className="h-12 w-12 mb-3" />
          <p className="text-lg font-medium">Tidak ada artikel ditemukan</p>
          <p className="text-sm mt-1">
            Coba ubah kata kunci atau kategori pencarian Anda.
          </p>
        </div>
      )}
    </div>
  )
}
