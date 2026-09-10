import { Skeleton } from "@/components/ui/skeleton"

export default function QuizLoading() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Skeleton className="h-7 w-7 rounded" />
          <Skeleton className="h-9 w-48" />
        </div>
        <Skeleton className="h-5 w-80 mt-2" />
      </div>

      {/* Quiz cards grid skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-lg border bg-card shadow-sm"
          >
            {/* Cover placeholder */}
            <Skeleton className="h-32 w-full rounded-none" />

            {/* Card content */}
            <div className="p-6 space-y-3">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      {/* History skeleton */}
      <div className="mt-12">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-8 w-36" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border bg-card p-4"
            >
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
