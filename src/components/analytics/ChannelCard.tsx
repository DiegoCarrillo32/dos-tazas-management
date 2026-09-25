'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { AnalyticsReport } from '@/utils/analytics-insights'
import { BarList } from './BarList'
import type { AnalyticsFormat } from './chart-theme'

export function ChannelCard({ channel, format }: { channel: AnalyticsReport['channel']; format: AnalyticsFormat }) {
  const { t, money, pct, number } = format
  const rows = [
    { row: channel.retail, label: t('analytics_channel_retail'), swatch: 'bg-coffee-fruit' },
    { row: channel.b2b, label: t('analytics_channel_b2b'), swatch: 'bg-warm-roast' }
  ]
  const total = channel.retail.revenue + channel.b2b.revenue

  return (
    <Card className="shadow-md border-warm-roast/10">
      <CardHeader className="pt-5">
        <CardTitle className="text-lg font-heading text-expresso">{t('analytics_channel_title')}</CardTitle>
      </CardHeader>
      <CardContent className="pb-5 space-y-5">
        {total === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-expresso/50 text-sm">{t('analytics_no_data')}</div>
        ) : (
          <>
            {/* Share of revenue as one stacked bar; 2px gap between segments. */}
            <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
              {rows.map(({ row, swatch }) =>
                row.revenue > 0 ? <div key={row.name} className={swatch} style={{ width: `${row.share}%` }} /> : null
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {rows.map(({ row, label, swatch }) => (
                <div key={row.name} className="rounded-xl border border-warm-roast/10 bg-warm-roast/5 p-3 space-y-1">
                  <p className="flex items-center gap-2 text-xs font-bold text-expresso/60">
                    <span className={cn('h-2.5 w-2.5 rounded-full', swatch)} />
                    {label}
                  </p>
                  <p className="text-xl font-heading text-expresso">{money(row.revenue)}</p>
                  <p className="text-xs text-expresso/60">
                    {pct(row.share)} · {number(row.orders)} {t('analytics_orders').toLowerCase()} · {t('analytics_margin')} {pct(row.margin)}
                  </p>
                </div>
              ))}
            </div>
            {channel.partners.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wide text-expresso/60">{t('analytics_top_partners')}</p>
                <BarList
                  barClassName="bg-warm-roast"
                  items={channel.partners.slice(0, 5).map((p) => ({
                    key: p.name,
                    label: p.name,
                    value: p.revenue,
                    display: money(p.revenue),
                    hint: pct(p.share)
                  }))}
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
