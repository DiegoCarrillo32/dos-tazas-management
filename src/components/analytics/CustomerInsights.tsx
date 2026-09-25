'use client'

import { Badge, DataTable, type Column } from 'dos-tazas-design-system'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AnalyticsReport, AtRiskCustomer, CustomerStat } from '@/utils/analytics-insights'
import { fillTemplate, type AnalyticsFormat } from './chart-theme'

const TOP_LIMIT = 10

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-warm-roast/10 bg-card p-4 shadow-sm shadow-warm-roast/5">
      <p className="text-xs font-bold text-expresso/60">{label}</p>
      <p className="mt-1 text-2xl font-heading text-expresso">{value}</p>
    </div>
  )
}

export function CustomerInsights({ customers, format }: { customers: AnalyticsReport['customers']; format: AnalyticsFormat }) {
  const { t, money, shortMoney, pct, number, date } = format
  const amount = (n: number) => (
    <>
      <span className="sm:hidden">{shortMoney(n)}</span>
      <span className="hidden sm:inline">{money(n)}</span>
    </>
  )
  const days = (n: number) => fillTemplate(t('analytics_days'), { count: number(n) })

  const topColumns: Column<CustomerStat>[] = [
    {
      key: 'name',
      header: t('analytics_customer'),
      cell: (c) => (
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-bold text-expresso break-words">
          {c.name}
          {c.isNew && <Badge variant="soft">{t('analytics_new_badge')}</Badge>}
        </span>
      )
    },
    { key: 'orders', header: t('analytics_orders'), align: 'right', cell: (c) => number(c.orders) },
    { key: 'aov', header: t('analytics_aov'), align: 'right', className: 'hidden md:table-cell', cell: (c) => money(c.aov) },
    { key: 'last', header: t('analytics_last_order'), align: 'right', className: 'hidden sm:table-cell', cell: (c) => date(c.lastOrder) },
    { key: 'revenue', header: t('analytics_revenue'), align: 'right', cell: (c) => <span className="font-bold text-expresso whitespace-nowrap">{amount(c.revenue)}</span> }
  ]

  const riskColumns: Column<AtRiskCustomer>[] = [
    { key: 'name', header: t('analytics_customer'), cell: (c) => <span className="font-bold text-expresso">{c.name}</span> },
    { key: 'since', header: t('analytics_days_since'), align: 'right', cell: (c) => <span className="font-bold text-red-600 dark:text-red-400">{days(c.daysSince)}</span> },
    { key: 'gap', header: t('analytics_usual_gap'), align: 'right', className: 'hidden sm:table-cell', cell: (c) => days(c.avgInterval) },
    { key: 'lifetime', header: t('analytics_lifetime_revenue'), align: 'right', className: 'hidden sm:table-cell', cell: (c) => money(c.lifetimeRevenue) }
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile label={t('analytics_new_customers')} value={customers.newCount === null ? '—' : number(customers.newCount)} />
        <Tile label={t('analytics_returning_customers')} value={customers.returningCount === null ? '—' : number(customers.returningCount)} />
        <Tile label={t('analytics_repeat_rate')} value={pct(customers.repeatRate)} />
        <Tile label={t('analytics_top20_share')} value={pct(customers.top20Share)} />
      </div>

      <Card className="shadow-md border-warm-roast/10">
        <CardHeader className="pt-5">
          <CardTitle className="text-lg font-heading text-expresso">{t('analytics_top_customers')}</CardTitle>
        </CardHeader>
        <CardContent className="pb-5">
          <DataTable
            className="overflow-x-auto"
            columns={topColumns}
            data={customers.all.slice(0, TOP_LIMIT)}
            rowKey={(c) => c.id}
            empty={t('analytics_no_data')}
          />
        </CardContent>
      </Card>

      <Card className="shadow-md border-warm-roast/10">
        <CardHeader className="pt-5">
          <CardTitle className="text-lg font-heading text-expresso">{t('analytics_at_risk_title')}</CardTitle>
          <p className="text-sm text-expresso/60">{t('analytics_at_risk_hint')}</p>
        </CardHeader>
        <CardContent className="pb-5">
          <DataTable
            className="overflow-x-auto"
            columns={riskColumns}
            data={customers.atRisk.slice(0, TOP_LIMIT)}
            rowKey={(c) => c.id}
            empty={t('analytics_at_risk_empty')}
          />
        </CardContent>
      </Card>
    </div>
  )
}
