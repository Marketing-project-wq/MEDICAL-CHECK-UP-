import { notFound } from "next/navigation"
import Link from "next/link"
import { Lock } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { ArticleReader } from "@/components/articles/article-reader"
import { ArticleCard } from "@/components/articles/article-card"
import { Button } from "@/components/ui/button"
import type { Article } from "@/lib/types"
import type { Metadata } from "next"

type Params = { slug: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: article } = await supabase
    .from("articles")
    .select("title, excerpt, cover_image_url")
    .eq("slug", slug)
    .single()

  if (!article) {
    return { title: "Artikel Tidak Ditemukan" }
  }

  return {
    title: `${article.title} | MCU My20Fit`,
    description: article.excerpt ?? undefined,
    openGraph: {
      title: article.title,
      description: article.excerpt ?? undefined,
      images: article.cover_image_url ? [article.cover_image_url] : undefined,
    },
  }
}

export default async function ArticleSlugPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch the article
  const { data: article, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .single()

  if (error || !article) {
    notFound()
  }

  const typedArticle = article as Article

  // Check auth for premium articles
  if (typedArticle.is_premium) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1E3A5F]/10 mb-6">
              <Lock className="h-8 w-8 text-[#1E3A5F]" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold mb-4">
              {typedArticle.title}
            </h1>

            {typedArticle.excerpt && (
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                {typedArticle.excerpt}
              </p>
            )}

            <p className="text-muted-foreground mb-6">
              Artikel ini hanya tersedia untuk pengguna terdaftar.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-[#FF6B35] text-white hover:bg-[#FF6B35]/90"
              >
                <Link href="/mcu/register">Daftar Sekarang</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/mcu/login">Sudah punya akun? Masuk</Link>
              </Button>
            </div>
          </div>
        </div>
      )
    }
  }

  // Fetch related articles (same category, excluding current)
  const { data: relatedArticles } = await supabase
    .from("articles")
    .select("*")
    .eq("category", typedArticle.category)
    .neq("slug", slug)
    .order("published_at", { ascending: false })
    .limit(3)

  const related: Article[] = (relatedArticles as Article[]) ?? []

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Full article */}
      <ArticleReader article={typedArticle} />

      {/* Related articles */}
      {related.length > 0 && (
        <section className="max-w-4xl mx-auto mt-16 pt-8 border-t">
          <h2 className="text-xl font-semibold mb-6">Artikel Terkait</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((rel) => (
              <ArticleCard
                key={rel.id}
                title={rel.title}
                slug={rel.slug}
                excerpt={rel.excerpt}
                cover_image_url={rel.cover_image_url}
                category={rel.category}
                read_time_minutes={rel.read_time_minutes}
                is_premium={rel.is_premium}
                author={rel.author}
                published_at={rel.published_at}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
