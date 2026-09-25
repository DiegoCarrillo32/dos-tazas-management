'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { WeekdayPoint } from '@/utils/analytics-insights'
import { useChartTheme, type AnalyticsFormat } from './chart-theme'

export function WeekdayChart({ data, format }: { data: WeekdayPoint[]; format: AnalyticsFormat }) {
  const { t, money, compactMoney, weekday, number } = format
  const { colors, tooltipStyle, tick } = useChartTheme()
  const hasData = data.some((d) => d.orders > 0)

  return (
    <Card className="shadow-md border-warm-roast/10">
      <CardHeader className="pt-5">
        <CardTitle className="text-lg font-heading text-expresso">{t('analytics_weekday_title')}</CardTitle>
      </CardHeader>
      <CardContent className="pb-5">
        {!hasData ? (
          <div className="h-[240px] flex items-center justify-center text-expresso/50 text-sm">{t('analytics_no_data')}</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
              <XAxis dataKey="day" tickFormatter={(d) => weekday(Number(d), 'short')} tick={tick} tickLine={false} axisLine={{ stroke: colors.axisLine }} />
              <YAxis tick={tick} tickLine={false} axisLine={false} tickFormatter={compactMoney} width={64} />
              <Tooltip
                cursor={{ fill: colors.cursor }}
                contentStyle={tooltipStyle}
                labelFormatter={(d) => weekday(Number(d))}
                formatter={(value, _name, item) => [
                  `${money(Number(value))} · ${number(item.payload.orders)} ${t('analytics_orders').toLowerCase()}`,
                  t('analytics_revenue')
                ]}
              />
              <Bar dataKey="revenue" fill={colors.primary} radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
