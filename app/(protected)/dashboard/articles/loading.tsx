import { Skeleton } from "@/components/ui/skeleton"

function ArticleCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Cover image skeleton */}
      <Skeleton className="aspect-[16/9] w-full rounded-none" />

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-1/2" />

        {/* Excerpt */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />

        {/* Meta row */}
        <div className="flex items-center justify-between pt-3 border-t">
          <Skeleton className="h-3 w-20" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardArticlesLoading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="mb-8">
        <Skeleton className="h-8 w-56 mb-2" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>

      {/* Recommendations skeleton */}
      <div className="mb-10">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <ArticleCardSkeleton key={`rec-${i}`} />
          ))}
        </div>
      </div>

      {/* Search skeleton */}
      <Skeleton className="h-10 w-full mb-6" />

      {/* Tabs skeleton */}
      <div className="flex gap-1 mb-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={`tab-${i}`} className="h-9 w-20 rounded-md" />
        ))}
      </div>

      {/* Section title */}
      <Skeleton className="h-6 w-32 mb-4" />

      {/* Articles grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <ArticleCardSkeleton key={`art-${i}`} />
        ))}
      </div>
    </div>
  )
}
