import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'
import { GripVertical, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  trend?: string
  color?: string
  /** Signed % change vs the previous period. */
  change?: number | null
  changeLabel?: string
  /** A rise is bad news (e.g. cost), so color it as a warning. */
  invertChange?: boolean
  dragHandleProps?: Record<string, unknown>
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'text-coffee-fruit', change, changeLabel, invertChange, dragHandleProps }: StatCardProps) {
  const up = (change ?? 0) >= 0
  const good = invertChange ? !up : up
  return (
    <Card className="shadow-md border-warm-roast/10 hover:shadow-lg transition-shadow h-full w-full">
      <CardContent className="p-5 flex flex-col justify-between h-full">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              {dragHandleProps && (
                <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing text-warm-roast/30 hover:text-warm-roast flex-shrink-0 touch-none">
                  <GripVertical className="h-5 w-5" />
                </div>
              )}
              <p className="text-sm font-medium text-expresso/60 mt-1">{title}</p>
            </div>
            <div className="bg-warm-roast/10 p-2.5 rounded-xl shrink-0">
              <Icon className="h-5 w-5 text-warm-roast" />
            </div>
          </div>
          <div>
            <p className={cn('text-2xl md:text-3xl font-heading', color)}>{value}</p>
            {subtitle && (
              <p className="text-xs text-expresso/50 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        {change !== undefined && change !== null && Number.isFinite(change) && (
          <p className="flex items-center gap-1 text-xs mt-3">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-bold',
                good
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              )}
            >
              {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {Math.abs(change).toFixed(1)}%
            </span>
            {changeLabel && <span className="text-expresso/50">{changeLabel}</span>}
          </p>
        )}
        {trend && (
          <p className="text-xs text-emerald-600 font-medium mt-3">{trend}</p>
        )}
      </CardContent>
    </Card>
  )
}
