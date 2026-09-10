import { createClient as createServerClient } from "@/lib/supabase/server"
import { ArticlesListClient } from "@/components/articles/articles-list-client"
import type { Article } from "@/lib/types"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Artikel Kesehatan | MCU My20Fit",
  description:
    "Baca artikel kesehatan terkini seputar nutrisi, olahraga, mental health, dan kualitas tidur.",
}

export default async function ArticlesPage() {
  const supabase = await createServerClient()

  // Check if user is authenticated (optional -- public page)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch all published articles ordered by newest first.
  // If the user is not authenticated, we still fetch all articles but flag
  // premium ones for the client to show a blur overlay + CTA.
  const { data: articles, error } = await supabase
    .from("articles")
    .select("*")
    .order("published_at", { ascending: false })

  if (error) {
    console.error("Error fetching articles:", error.message)
  }

  const allArticles: Article[] = (articles as Article[]) ?? []

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Artikel Kesehatan
        </h1>
        <p className="text-muted-foreground mt-2">
          Temukan tips dan informasi terkini untuk hidup lebih sehat.
        </p>
      </div>

      {/* Articles list with client-side search and filter.
          When the user is NOT authenticated, premium articles show a blur overlay. */}
      <ArticlesListClient
        articles={allArticles}
        showPremiumOverlay={!user}
      />
    </div>
  )
}
