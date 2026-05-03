import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  trend?: string
  color?: string
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'text-coffee-fruit' }: StatCardProps) {
  return (
    <Card className="shadow-md border-warm-roast/10 hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-expresso/60">{title}</p>
            <p className={`text-2xl md:text-3xl font-heading ${color}`}>{value}</p>
            {subtitle && (
              <p className="text-xs text-expresso/50">{subtitle}</p>
            )}
          </div>
          <div className="bg-warm-roast/10 p-3 rounded-xl">
            <Icon className="h-6 w-6 text-warm-roast" />
          </div>
        </div>
        {trend && (
          <p className="text-xs text-emerald-600 font-medium mt-3">{trend}</p>
        )}
      </CardContent>
    </Card>
  )
}
