import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'
import { GripVertical } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  trend?: string
  color?: string
  dragHandleProps?: Record<string, unknown>
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'text-coffee-fruit', dragHandleProps }: StatCardProps) {
  return (
    <Card className="shadow-md border-warm-roast/10 hover:shadow-lg transition-shadow h-full w-full">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-1">
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
            <p className={`text-2xl md:text-3xl font-heading ${color}`}>{value}</p>
            {subtitle && (
              <p className="text-xs text-expresso/50 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        {trend && (
          <p className="text-xs text-emerald-600 font-medium mt-3">{trend}</p>
        )}
      </CardContent>
    </Card>
  )
}
