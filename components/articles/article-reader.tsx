"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ArrowLeft, Clock, Share2, Check, User, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Article } from "@/lib/types"

type ArticleReaderProps = {
  article: Article
}

export function ArticleReader({ article }: ArticleReaderProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : ""

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: do nothing if clipboard API not available
    }
  }

  return (
    <article className="max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href="/articles"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Artikel
      </Link>

      {/* Cover image */}
      {article.cover_image_url && (
        <div className="relative aspect-[2/1] w-full overflow-hidden rounded-xl mb-8">
          <Image
            src={article.cover_image_url}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 896px"
            priority
          />
        </div>
      )}

      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge className="capitalize">{article.category}</Badge>
          {article.is_premium && (
            <Badge variant="secondary">Premium</Badge>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mb-4">
          {article.title}
        </h1>

        {article.excerpt && (
          <p className="text-lg text-muted-foreground leading-relaxed">
            {article.excerpt}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            <span>{article.author}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(article.published_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{article.read_time_minutes} menit baca</span>
          </div>

          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleShare}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Tersalin!
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />
                  Bagikan
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Markdown content */}
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-2xl sm:text-3xl font-bold mt-10 mb-4 text-foreground">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl sm:text-2xl font-semibold mt-8 mb-3 text-foreground border-b pb-2">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg sm:text-xl font-semibold mt-6 mb-2 text-foreground">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="leading-relaxed mb-4 text-foreground/90">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside space-y-1.5 mb-4 text-foreground/90">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside space-y-1.5 mb-4 text-foreground/90">
                {children}
              </ol>
            ),
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            a: ({ href, children }) => (
              <a
                href={href}
                className="text-primary hover:underline font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary/40 pl-4 italic text-muted-foreground my-4">
                {children}
              </blockquote>
            ),
            code: ({ className, children }) => {
              const isInline = !className
              if (isInline) {
                return (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                    {children}
                  </code>
                )
              }
              return (
                <code className={className}>{children}</code>
              )
            },
            pre: ({ children }) => (
              <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm my-4">
                {children}
              </pre>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-4">
                <table className="w-full border-collapse border border-border text-sm">
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border border-border bg-muted px-3 py-2 text-left font-semibold">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-border px-3 py-2">{children}</td>
            ),
            img: ({ src, alt }) => (
              <span className="block my-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={alt ?? ""}
                  className="rounded-lg max-w-full h-auto mx-auto"
                />
              </span>
            ),
            hr: () => <hr className="my-8 border-border" />,
          }}
        >
          {article.content}
        </ReactMarkdown>
      </div>

      {/* Tags */}
      {article.tags && article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t">
          {article.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </article>
  )
}
