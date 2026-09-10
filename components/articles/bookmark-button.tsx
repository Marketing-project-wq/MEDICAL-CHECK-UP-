"use client"

import { useState, useEffect } from "react"
import { Bookmark, BookmarkCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "mcu-bookmarked-articles"

function getBookmarks(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function setBookmarks(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // Storage unavailable
  }
}

export function BookmarkButton({ articleId }: { articleId: string }) {
  const [bookmarked, setBookmarked] = useState(false)

  useEffect(() => {
    setBookmarked(getBookmarks().includes(articleId))
  }, [articleId])

  const toggle = () => {
    const current = getBookmarks()
    let next: string[]

    if (current.includes(articleId)) {
      next = current.filter((id) => id !== articleId)
      setBookmarked(false)
    } else {
      next = [...current, articleId]
      setBookmarked(true)
    }

    setBookmarks(next)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle()
      }}
      aria-label={bookmarked ? "Hapus bookmark" : "Tambah bookmark"}
    >
      {bookmarked ? (
        <BookmarkCheck className="h-4 w-4 text-primary" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
    </Button>
  )
}
