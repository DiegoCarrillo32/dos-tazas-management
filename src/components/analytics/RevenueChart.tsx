'use client'

import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RevenueDataPoint } from '@/types'
import { useTranslation } from '@/i18n/LanguageProvider'
import { useTheme } from '@/providers/ThemeProvider'

interface RevenueChartProps {
  data: RevenueDataPoint[]
  currencySymbol?: string
}

export function RevenueChart({ data, currencySymbol = '$' }: RevenueChartProps) {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const checkDark = () => {
      if (theme === 'dark') return true
      if (theme === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches
      return false
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(checkDark())

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        setIsDark(mediaQuery.matches)
      }
    }
    mediaQuery.addEventListener('change', handleSystemThemeChange)
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
  }, [theme])

  const gridColor = isDark ? 'rgba(255, 245, 225, 0.08)' : 'rgba(65, 5, 5, 0.08)'
  const axisColor = isDark ? '#c2b5a3' : '#410505'
  const axisLineColor = isDark ? 'rgba(255, 245, 225, 0.15)' : 'rgba(65, 5, 5, 0.15)'
  const tooltipBg = isDark ? '#241616' : '#fff5e1'
  const tooltipBorder = isDark ? 'rgba(255, 245, 225, 0.1)' : 'rgba(122, 19, 24, 0.15)'
  const tooltipTextColor = isDark ? '#fff5e1' : '#410505'

  if (data.length === 0) {
    return (
      <Card className="shadow-md border-warm-roast/10 bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-lg font-heading text-expresso">
            {t('analytics_revenue_profit')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-expresso/50 text-sm">
            {t('analytics_no_data')}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-md border-warm-roast/10 bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="text-lg font-heading text-expresso">
          {t('analytics_revenue_profit')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#b92323" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#b92323" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: axisColor }}
              tickLine={false}
              axisLine={{ stroke: axisLineColor }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: axisColor }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${currencySymbol}${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: '8px',
                fontSize: '13px',
                color: tooltipTextColor
              }}
              formatter={(value, name) => {
                const label = name === 'revenue' ? t('analytics_total_revenue') : t('analytics_total_profit')
                return [`${currencySymbol}${Number(value).toFixed(2)}`, label]
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#b92323"
              strokeWidth={2}
              fill="url(#revenueGradient)"
            />
            <Area
              type="monotone"
              dataKey="profit"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#profitGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
