'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DictionaryKey } from '@/i18n/dictionaries'
import type { AnalyticsReport } from '@/utils/analytics-insights'
import { BarList } from './BarList'
import { fillTemplate, type AnalyticsFormat } from './chart-theme'

function Section({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="shadow-md border-warm-roast/10">
      <CardHeader className="pt-5 flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-lg font-heading text-expresso">{title}</CardTitle>
        {aside}
      </CardHeader>
      <CardContent className="pb-5">{children}</CardContent>
    </Card>
  )
}

export function OperationsPanel({
  report,
  format
}: {
  report: Pick<AnalyticsReport, 'receivables' | 'pipeline' | 'roasting'>
  format: AnalyticsFormat
}) {
  const { t, money, kg, number } = format
  const { receivables, pipeline, roasting } = report
  const ordersCount = (n: number) => fillTemplate(t('analytics_orders_count'), { count: number(n) })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Section
        title={t('analytics_receivables_title')}
        aside={
          <span className="rounded-full bg-warm-roast/10 px-3 py-1 text-xs font-bold text-warm-roast">{money(receivables.total)}</span>
        }
      >
        {receivables.orders === 0 ? (
          <p className="py-6 text-center text-sm text-expresso/50">{t('analytics_no_data')}</p>
        ) : (
          <BarList
            items={receivables.aging.map((a) => ({
              key: a.key,
              label: t(`analytics_aging_${a.key}`),
              value: a.amount,
              display: money(a.amount),
              hint: ordersCount(a.orders)
            }))}
          />
        )}
      </Section>

      <Section title={t('analytics_pipeline_title')}>
        <div className="grid grid-cols-3 gap-3">
          {pipeline.map((p) => (
            <div key={p.status} className="rounded-xl border border-warm-roast/10 bg-warm-roast/5 p-3 text-center">
              <p className="text-xs font-bold text-expresso/60">{t(`orders_${p.status}` as DictionaryKey)}</p>
              <p className="mt-1 text-2xl font-heading text-expresso">{number(p.orders)}</p>
              <p className="text-xs text-expresso/50">{kg(p.grams)}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title={t('analytics_roasting_title')}
        aside={
          <span className="rounded-full bg-warm-roast/10 px-3 py-1 text-xs font-bold text-warm-roast">
            {money(roasting.revenue)} · {kg(roasting.roastedGrams)}
          </span>
        }
      >
        {roasting.byStatus.length === 0 ? (
          <p className="py-6 text-center text-sm text-expresso/50">{t('analytics_no_data')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-expresso/60">{t('analytics_by_status')}</p>
              <BarList
                barClassName="bg-warm-roast"
                items={roasting.byStatus.map((s) => ({
                  key: s.status,
                  label: t(`roasting_status_${s.status}` as DictionaryKey),
                  value: s.jobs,
                  display: number(s.jobs),
                  hint: money(s.revenue)
                }))}
              />
            </div>
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-expresso/60">{t('analytics_by_partner')}</p>
              <BarList
                items={roasting.byPartner.slice(0, 5).map((p) => ({
                  key: p.name || '__unassigned',
                  label: p.name || t('analytics_unassigned'),
                  value: p.revenue,
                  display: money(p.revenue),
                  hint: ordersCount(p.jobs)
                }))}
              />
            </div>
          </div>
        )}
      </Section>
    </div>
  )
}
