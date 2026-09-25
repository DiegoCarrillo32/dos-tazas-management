'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Granularity, TrendPoint } from '@/utils/analytics-insights'
import { parseLocalDay } from '@/utils/analytics-insights'
import { useChartTheme, type AnalyticsFormat } from './chart-theme'

interface RevenueChartProps {
  data: TrendPoint[]
  granularity: Granularity
  format: AnalyticsFormat
}

export function RevenueChart({ data, granularity, format }: RevenueChartProps) {
  const { t, locale, money, compactMoney, number, kg } = format
  const { colors, tooltipStyle, tick } = useChartTheme()
  const hasData = data.some((d) => d.orders > 0)

  const bucketLabel = (key: string) =>
    parseLocalDay(key).toLocaleDateString(
      locale,
      granularity === 'month' ? { month: 'short', year: 'numeric' } : { month: 'short', day: 'numeric' }
    )
  const byKey = new Map(data.map((d) => [d.key, d]))

  return (
    <Card className="shadow-md border-warm-roast/10 bg-card text-card-foreground">
      <CardHeader className="pt-5 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-lg font-heading text-expresso">{t('analytics_revenue_profit')}</CardTitle>
        <span className="rounded-full bg-warm-roast/10 px-3 py-1 text-xs font-bold text-warm-roast">
          {t(`analytics_trend_${granularity}`)}
        </span>
      </CardHeader>
      <CardContent className="pb-5">
        {!hasData ? (
          <div className="h-[300px] flex items-center justify-center text-expresso/50 text-sm">
            {t('analytics_no_data')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.positive} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors.positive} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
              <XAxis
                dataKey="key"
                tickFormatter={bucketLabel}
                tick={tick}
                tickLine={false}
                axisLine={{ stroke: colors.axisLine }}
                minTickGap={16}
              />
              <YAxis tick={tick} tickLine={false} axisLine={false} tickFormatter={compactMoney} width={64} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(key) => {
                  const point = byKey.get(String(key))
                  const suffix = point ? ` · ${number(point.orders)} ${t('analytics_orders').toLowerCase()} · ${kg(point.grams)}` : ''
                  return `${bucketLabel(String(key))}${suffix}`
                }}
                formatter={(value, name) => [
                  money(Number(value)),
                  name === 'revenue' ? t('analytics_revenue') : t('analytics_profit')
                ]}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 12, color: colors.axis }}
                formatter={(name) => (name === 'revenue' ? t('analytics_revenue') : t('analytics_profit'))}
              />
              <Area type="monotone" dataKey="revenue" stroke={colors.primary} strokeWidth={2} fill="url(#revenueGradient)" />
              <Area type="monotone" dataKey="profit" stroke={colors.positive} strokeWidth={2} fill="url(#profitGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
