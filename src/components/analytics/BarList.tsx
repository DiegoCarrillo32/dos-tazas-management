import { cn } from '@/lib/utils'

export interface BarListItem {
  key: string
  label: React.ReactNode
  /** Secondary line under the label, e.g. a coffee's varietals. */
  sublabel?: React.ReactNode
  value: number
  /** Right-hand text; defaults to the raw value. */
  display?: React.ReactNode
  hint?: React.ReactNode
}

/**
 * Ranked horizontal bars rendered in plain HTML — one hue, magnitude only.
 * Lighter than a chart for short labelled lists (costs, aging, partners).
 */
export function BarList({ items, barClassName }: { items: BarListItem[]; barClassName?: string }) {
  const max = Math.max(...items.map((i) => i.value), 0)
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.key} className="space-y-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0">
              <span className="block truncate text-expresso/80">{item.label}</span>
              {item.sublabel && <span className="block truncate text-xs text-expresso/50">{item.sublabel}</span>}
            </span>
            <span className="shrink-0 font-bold text-expresso">
              {item.display ?? item.value}
              {item.hint && <span className="ml-1.5 text-xs font-medium text-expresso/50">{item.hint}</span>}
            </span>
          </div>
          <div className="h-2 rounded-full bg-warm-roast/10">
            <div
              className={cn('h-2 rounded-full bg-coffee-fruit', barClassName)}
              style={{ width: `${max > 0 ? Math.max((item.value / max) * 100, item.value > 0 ? 2 : 0) : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
