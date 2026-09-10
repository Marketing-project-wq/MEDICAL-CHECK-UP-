"use client"

import { useState, useMemo } from "react"
import { Search, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArticleCard } from "@/components/articles/article-card"
import type { Article } from "@/lib/types"

const CATEGORIES = [
  { value: "semua", label: "Semua" },
  { value: "nutrisi", label: "Nutrisi" },
  { value: "olahraga", label: "Olahraga" },
  { value: "mental health", label: "Mental Health" },
  { value: "tidur", label: "Tidur" },
]

type ArticlesListClientProps = {
  articles: Article[]
  /** When true, premium articles without access show a blur overlay. */
  showPremiumOverlay?: boolean
}

export function ArticlesListClient({
  articles,
  showPremiumOverlay = false,
}: ArticlesListClientProps) {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("semua")

  const filtered = useMemo(() => {
    let result = articles

    // Category filter
    if (activeCategory !== "semua") {
      result = result.filter(
        (a) => a.category.toLowerCase() === activeCategory
      )
    }

    // Search filter
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

      {/* Articles grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((article) => (
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
              showPremiumOverlay={showPremiumOverlay}
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
