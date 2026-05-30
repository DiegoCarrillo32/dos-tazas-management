'use client'

export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="w-full max-w-7xl mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-8 w-48 bg-warm-roast/10 rounded-lg mb-2" />
          <div className="h-4 w-64 bg-warm-roast/10 rounded-md" />
        </div>
        <div className="h-9 w-32 bg-warm-roast/10 rounded-full" />
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="rounded-xl border border-warm-roast/10 p-4 space-y-4 min-h-[200px]">
            <div className="h-6 w-32 bg-warm-roast/10 rounded-md" />
            <div className="space-y-3">
              <div className="h-24 bg-warm-roast/5 rounded-lg" />
              <div className="h-24 bg-warm-roast/5 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TableSkeleton({ cols = 5, rows = 4 }: { cols?: number; rows?: number }) {
  return (
    <div className="w-full max-w-7xl mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-8 w-48 bg-warm-roast/10 rounded-lg mb-2" />
          <div className="h-4 w-64 bg-warm-roast/10 rounded-md" />
        </div>
        <div className="h-9 w-32 bg-warm-roast/10 rounded-full" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-warm-roast/10 overflow-hidden shadow-lg">
        <div className="bg-warm-roast/5 px-6 py-4 border-b border-warm-roast/10">
          <div className="h-5 w-40 bg-warm-roast/10 rounded-md" />
        </div>
        <div>
          {/* Header row */}
          <div className={`grid gap-4 px-6 py-3 border-b border-warm-roast/10 bg-warm-roast/5`}
               style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }).map((_, i) => (
              <div key={i} className="h-4 bg-warm-roast/10 rounded-md" />
            ))}
          </div>
          {/* Data rows */}
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className={`grid gap-4 px-6 py-4 border-b border-warm-roast/5`}
                 style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
              {Array.from({ length: cols }).map((_, j) => (
                <div key={j} className="h-4 bg-warm-roast/5 rounded-md" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function TableRowSkeleton({ cols = 5, rows = 3 }: { cols?: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse border-b border-warm-roast/5">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-6 py-4">
              <div className="h-4 bg-warm-roast/10 rounded w-full max-w-[120px]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
