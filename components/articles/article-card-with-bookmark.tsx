"use client"

import Link from "next/link"
import Image from "next/image"
import { Clock, Lock, User } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookmarkButton } from "@/components/articles/bookmark-button"
import type { Article } from "@/lib/types"

type ArticleCardWithBookmarkProps = Pick<
  Article,
  | "id"
  | "title"
  | "slug"
  | "excerpt"
  | "cover_image_url"
  | "category"
  | "read_time_minutes"
  | "is_premium"
  | "author"
  | "published_at"
>

const categoryColors: Record<string, string> = {
  nutrisi: "bg-green-500",
  olahraga: "bg-blue-500",
  "mental health": "bg-purple-500",
  tidur: "bg-indigo-500",
}

function getCategoryColor(category: string): string {
  return categoryColors[category.toLowerCase()] ?? "bg-primary"
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function ArticleCardWithBookmark({
  id,
  title,
  slug,
  excerpt,
  cover_image_url,
  category,
  read_time_minutes,
  is_premium,
  author,
  published_at,
}: ArticleCardWithBookmarkProps) {
  return (
    <Link href={`/dashboard/articles/${slug}`} className="block h-full group">
      <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 h-full flex flex-col">
        {/* Cover image or colored placeholder */}
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          {cover_image_url ? (
            <Image
              src={cover_image_url}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div
              className={`h-full w-full ${getCategoryColor(category)} flex items-center justify-center`}
            >
              <span className="text-white/80 text-4xl font-bold uppercase">
                {category.charAt(0)}
              </span>
            </div>
          )}

          {/* Category badge */}
          <div className="absolute left-3 top-3">
            <Badge className="bg-white/90 text-foreground hover:bg-white/90 text-xs capitalize">
              {category}
            </Badge>
          </div>

          {/* Premium badge */}
          {is_premium && (
            <div className="absolute right-3 top-3">
              <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary text-xs gap-1">
                <Lock className="h-3 w-3" />
                Premium
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <CardContent className="flex flex-col flex-1 p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {title}
            </h3>
            <BookmarkButton articleId={id} />
          </div>

          {excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
              {excerpt}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-3 border-t">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="truncate max-w-[120px]">{author}</span>
            </div>
            <div className="flex items-center gap-3">
              <span>{formatDate(published_at)}</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{read_time_minutes} menit</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
