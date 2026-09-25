'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '@/providers/ThemeProvider'
import { useTranslation } from '@/i18n/LanguageProvider'
import { PREPARATION_METHODS, ROAST_LEVELS } from '@/config/orderOptions'
import type { DictionaryKey } from '@/i18n/dictionaries'

// Recharts takes literal colors, so chart code reads them from here rather
// than scattering hex values across components. Values mirror the brand
// tokens in globals.css for each mode.
const LIGHT = {
  primary: '#b92323', // coffee-fruit
  secondary: '#7a1318', // warm-roast
  positive: '#059669',
  grid: 'rgba(65, 5, 5, 0.08)',
  axis: '#410505',
  axisLine: 'rgba(65, 5, 5, 0.15)',
  tooltipBg: '#fff5e1',
  tooltipBorder: 'rgba(122, 19, 24, 0.15)',
  tooltipText: '#410505',
  cursor: 'rgba(122, 19, 24, 0.06)'
}

const DARK: typeof LIGHT = {
  primary: '#d64545', // fruit-light reads better on the dark surface
  secondary: '#c2b5a3',
  positive: '#34d399',
  grid: 'rgba(255, 245, 225, 0.08)',
  axis: '#c2b5a3',
  axisLine: 'rgba(255, 245, 225, 0.15)',
  tooltipBg: '#241616',
  tooltipBorder: 'rgba(255, 245, 225, 0.1)',
  tooltipText: '#fff5e1',
  cursor: 'rgba(255, 245, 225, 0.06)'
}

export function useChartTheme() {
  const { theme } = useTheme()
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => setIsDark(theme === 'dark' || (theme === 'system' && mediaQuery.matches))
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [theme])

  const colors = isDark ? DARK : LIGHT
  return {
    colors,
    tooltipStyle: {
      backgroundColor: colors.tooltipBg,
      border: `1px solid ${colors.tooltipBorder}`,
      borderRadius: '8px',
      fontSize: '13px',
      color: colors.tooltipText
    },
    tick: { fontSize: 12, fill: colors.axis }
  }
}

const OPTION_LABELS = new Map<string, DictionaryKey>(
  [...ROAST_LEVELS, ...PREPARATION_METHODS].map((o) => [o.value, o.labelKey])
)

/** Number/date formatting in the active UI language. */
export function useAnalyticsFormat(currencySymbol: string) {
  const { t, language } = useTranslation()
  const locale = language === 'es' ? 'es-CR' : 'en-US'
  const number = (n: number, digits = 0) =>
    n.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })

  return {
    t,
    locale,
    number,
    money: (n: number) => `${n < 0 ? '-' : ''}${currencySymbol}${number(Math.abs(n), 2)}`,
    /** Full amount below a million, compact (₡13.6M) from there up. */
    shortMoney: (n: number) =>
      Math.abs(n) >= 1_000_000
        ? `${n < 0 ? '-' : ''}${currencySymbol}${Math.abs(n).toLocaleString(locale, { notation: 'compact', maximumFractionDigits: 1 })}`
        : `${n < 0 ? '-' : ''}${currencySymbol}${number(Math.abs(n), 2)}`,
    compactMoney: (n: number) =>
      `${currencySymbol}${n.toLocaleString(locale, { notation: 'compact', maximumFractionDigits: 1 })}`,
    pct: (n: number | null) => (n === null ? '—' : `${number(n, 1)}%`),
    kg: (grams: number) => `${number(grams / 1000, 2)} kg`,
    date: (iso: string) => new Date(iso).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' }),
    weekday: (day: number, style: 'long' | 'short' = 'long') =>
      // 2024-01-07 was a Sunday, so day 0..6 maps onto Jan 7..13.
      new Date(2024, 0, 7 + day).toLocaleDateString(locale, { weekday: style }),
    /** Translates known roast/prep codes; empty names are "Unassigned". */
    label: (name: string) => {
      if (!name) return t('analytics_unassigned')
      const key = OPTION_LABELS.get(name)
      return key ? t(key) : name
    }
  }
}

export type AnalyticsFormat = ReturnType<typeof useAnalyticsFormat>

/** Replaces `{param}` placeholders in a translated template. */
export function fillTemplate(template: string, params: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (match, key) => params[key] ?? match)
}
