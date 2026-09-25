'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MixRow } from '@/utils/analytics-insights'
import { BarList } from './BarList'
import type { AnalyticsFormat } from './chart-theme'

/** Kilograms sold per coffee (inventory item), with its varietals. */
export function CoffeesSoldCard({ coffees, format }: { coffees: MixRow[]; format: AnalyticsFormat }) {
  const { t, kg, money, label } = format
  const rows = [...coffees].sort((a, b) => b.grams - a.grams)

  return (
    <Card className="shadow-md border-warm-roast/10">
      <CardHeader className="pt-5">
        <CardTitle className="text-lg font-heading text-expresso">{t('analytics_coffees_sold')}</CardTitle>
      </CardHeader>
      <CardContent className="pb-5">
        {rows.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-expresso/50 text-sm">{t('analytics_no_data')}</div>
        ) : (
          <BarList
            items={rows.map((c) => ({
              key: c.name || '__unassigned',
              label: label(c.name),
              sublabel: c.detail,
              value: c.grams,
              display: kg(c.grams),
              hint: money(c.revenue)
            }))}
          />
        )}
      </CardContent>
    </Card>
  )
}
