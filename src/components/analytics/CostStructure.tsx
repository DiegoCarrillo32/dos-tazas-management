'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AnalyticsReport } from '@/utils/analytics-insights'
import { BarList } from './BarList'
import type { AnalyticsFormat } from './chart-theme'

export function CostStructure({
  costs,
  costPerKg,
  format
}: {
  costs: AnalyticsReport['costs']
  costPerKg: number
  format: AnalyticsFormat
}) {
  const { t, money, pct } = format
  return (
    <Card className="shadow-md border-warm-roast/10">
      <CardHeader className="pt-5 flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-lg font-heading text-expresso">{t('analytics_cost_structure')}</CardTitle>
        {costPerKg > 0 && (
          <span className="rounded-full bg-warm-roast/10 px-3 py-1 text-xs font-bold text-warm-roast">
            {t('analytics_cost_per_kg')}: {money(costPerKg)}
          </span>
        )}
      </CardHeader>
      <CardContent className="pb-5">
        {costs.length === 0 ? (
          <p className="py-6 text-center text-sm text-expresso/50">{t('analytics_cost_empty')}</p>
        ) : (
          <BarList
            barClassName="bg-warm-roast"
            items={costs.map((c) => ({
              key: c.component,
              label: t(`analytics_cost_${c.component}`),
              value: c.amount,
              display: money(c.amount),
              hint: pct(c.share)
            }))}
          />
        )}
      </CardContent>
    </Card>
  )
}
