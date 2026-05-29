'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { BreakdownItem } from '@/types'
import { useTheme } from '@/providers/ThemeProvider'
import { useTranslation } from '@/i18n/LanguageProvider'

const LIGHT_COLORS = ['#b92323', '#7a1318', '#410505', '#d45b5b', '#e88a8a', '#993333']
const DARK_COLORS = ['#b92323', '#d64545', '#7a1318', '#c2b5a3', '#e88a8a', '#993333']

interface BreakdownChartProps {
  title: string
  data: BreakdownItem[]
  valueLabel?: string
  isDark: boolean
}

function BreakdownChart({ title, data, valueLabel = 'grams', isDark }: BreakdownChartProps) {
  const { t } = useTranslation()
  const gridColor = isDark ? 'rgba(255, 245, 225, 0.08)' : 'rgba(65, 5, 5, 0.08)'
  const axisColor = isDark ? '#c2b5a3' : '#410505'
  const tooltipBg = isDark ? '#241616' : '#fff5e1'
  const tooltipBorder = isDark ? 'rgba(255, 245, 225, 0.1)' : 'rgba(122, 19, 24, 0.15)'
  const tooltipTextColor = isDark ? '#fff5e1' : '#410505'
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  if (data.length === 0) {
    return (
      <Card className="shadow-md border-warm-roast/10 bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-lg font-heading text-expresso">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-expresso/50 text-sm">
            {t('analytics_no_data')}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-md border-warm-roast/10 bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="text-lg font-heading text-expresso">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: axisColor }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}kg`}
            />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fontSize: 12, fill: axisColor }}
              tickLine={false}
              axisLine={false}
              width={120}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: '8px',
                fontSize: '13px',
                color: tooltipTextColor
              }}
              formatter={(value) => [
                `${(Number(value) / 1000).toFixed(2)} kg`,
                valueLabel === 'grams' ? t('analytics_coffee_sold') : valueLabel
              ]}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

interface BreakdownChartsProps {
  roastData: BreakdownItem[]
  prepData: BreakdownItem[]
}

export function BreakdownCharts({ roastData, prepData }: BreakdownChartsProps) {
  const { theme } = useTheme()
  const { t } = useTranslation()
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <BreakdownChart title={t('analytics_by_roast')} data={roastData} isDark={isDark} />
      <BreakdownChart title={t('analytics_by_prep')} data={prepData} isDark={isDark} />
    </div>
  )
}
