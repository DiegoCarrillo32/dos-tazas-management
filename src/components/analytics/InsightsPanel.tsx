'use client'

import { AlertTriangle, Lightbulb, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { DictionaryKey } from '@/i18n/dictionaries'
import type { Insight } from '@/utils/analytics-insights'
import { fillTemplate, type AnalyticsFormat } from './chart-theme'

const TONE = {
  positive: { icon: TrendingUp, className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  warning: { icon: AlertTriangle, className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  neutral: { icon: Lightbulb, className: 'bg-warm-roast/10 text-warm-roast' }
} as const

// Params are formatted by name — see Insight['params'].
function formatParams(params: Insight['params'], f: AnalyticsFormat): Record<string, string> {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === 'number') {
        if (key.startsWith('amount')) return [key, f.money(value)]
        if (key.startsWith('pct')) return [key, f.pct(value)]
        if (key === 'kg') return [key, f.number(value, 1)]
        if (key === 'day') return [key, f.weekday(value)]
        return [key, f.number(value)]
      }
      if (key === 'component') return [key, f.t(`analytics_cost_${value}` as DictionaryKey)]
      if (key === 'name') return [key, f.label(value)]
      return [key, value]
    })
  )
}

export function InsightsPanel({ insights, format }: { insights: Insight[]; format: AnalyticsFormat }) {
  const { t } = format
  return (
    <Card className="shadow-md border-warm-roast/10">
      <CardHeader className="pt-5">
        <CardTitle className="text-lg font-heading text-expresso">{t('analytics_insights_title')}</CardTitle>
      </CardHeader>
      <CardContent className="pb-5">
        {insights.length === 0 ? (
          <p className="text-sm text-expresso/50 py-6 text-center">{t('analytics_insights_empty')}</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((insight) => {
              const tone = TONE[insight.tone]
              const Icon = tone.icon
              return (
                <li
                  key={insight.id}
                  className="flex items-start gap-3 rounded-xl border border-warm-roast/10 bg-warm-roast/5 p-3"
                >
                  <span className={cn('shrink-0 rounded-lg p-2', tone.className)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="text-sm text-expresso/80 leading-relaxed">
                    {fillTemplate(t(`insight_${insight.id}` as DictionaryKey), formatParams(insight.params, format))}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
