'use client'

import { useState } from 'react'
import { DataTable, SegmentedControl, type Column } from 'dos-tazas-design-system'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { AnalyticsReport, MixRow } from '@/utils/analytics-insights'
import type { AnalyticsFormat } from './chart-theme'

type Dimension = keyof AnalyticsReport['mix']

export function ProductMix({ mix, format }: { mix: AnalyticsReport['mix']; format: AnalyticsFormat }) {
  const { t, money, shortMoney, pct, kg, number, label } = format
  const [dimension, setDimension] = useState<Dimension>('coffee')
  const avgMargin = (() => {
    const rows = mix[dimension]
    const revenue = rows.reduce((s, r) => s + r.revenue, 0)
    return revenue > 0 ? (rows.reduce((s, r) => s + r.profit, 0) / revenue) * 100 : null
  })()

  const columns: Column<MixRow>[] = [
    {
      key: 'name',
      header: t(`analytics_dim_${dimension}`),
      cell: (r) => (
        <div className="min-w-0">
          <p className="font-bold text-expresso">{label(r.name)}</p>
          {r.detail && <p className="text-xs text-expresso/50">{r.detail}</p>}
        </div>
      )
    },
    { key: 'orders', header: t('analytics_orders'), align: 'right', className: 'hidden sm:table-cell', cell: (r) => number(r.orders) },
    { key: 'kg', header: 'kg', align: 'right', className: 'hidden md:table-cell', cell: (r) => kg(r.grams) },
    { key: 'revenue', header: t('analytics_revenue'), align: 'right', cell: (r) => (
      <span className="whitespace-nowrap">
        <span className="sm:hidden">{shortMoney(r.revenue)}</span>
        <span className="hidden sm:inline">{money(r.revenue)}</span>
      </span>
    ) },
    {
      key: 'share',
      header: t('analytics_share'),
      className: 'hidden sm:table-cell w-40',
      cell: (r) => (
        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 rounded-full bg-warm-roast/10">
            <div className="h-2 rounded-full bg-coffee-fruit" style={{ width: `${r.share}%` }} />
          </div>
          <span className="w-12 text-right text-xs text-expresso/60">{pct(r.share)}</span>
        </div>
      )
    },
    { key: 'profit', header: t('analytics_profit'), align: 'right', className: 'hidden md:table-cell', cell: (r) => money(r.profit) },
    {
      key: 'margin',
      header: t('analytics_margin'),
      align: 'right',
      cell: (r) => (
        <span
          className={cn(
            'font-bold',
            r.margin !== null && avgMargin !== null && r.margin < avgMargin - 5 ? 'text-red-600 dark:text-red-400' : 'text-expresso'
          )}
        >
          {pct(r.margin)}
        </span>
      )
    }
  ]

  return (
    <Card className="shadow-md border-warm-roast/10">
      <CardHeader className="pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <CardTitle className="text-lg font-heading text-expresso">{t('analytics_mix_title')}</CardTitle>
        <SegmentedControl
          size="sm"
          value={dimension}
          onValueChange={(v) => setDimension(v as Dimension)}
          options={(['coffee', 'roast', 'prep'] as const).map((d) => ({ value: d, label: t(`analytics_dim_${d}`) }))}
        />
      </CardHeader>
      <CardContent className="pb-5">
        <DataTable
          className="overflow-x-auto"
          columns={columns}
          data={mix[dimension]}
          rowKey={(r) => r.name || '__unassigned'}
          empty={t('analytics_no_data')}
        />
      </CardContent>
    </Card>
  )
}
