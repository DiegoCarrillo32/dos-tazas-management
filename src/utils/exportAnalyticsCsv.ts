import type { AnalyticsDataset, AnalyticsOrderRow } from '@/types'
import type { AnalyticsReport } from '@/utils/analytics-insights'

// Column headers are stable snake_case field names rather than translated
// labels, so spreadsheets and scripts built on an export keep working
// regardless of the UI language.

type Cell = string | number | boolean | null | undefined

const FORMULA_PREFIX = /^[=+\-@\t\r]/

function escapeCell(value: Cell): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number') return Number.isFinite(value) ? String(Math.round(value * 100) / 100) : ''
  let s = String(value)
  // Neutralise spreadsheet formula injection from user-entered text.
  if (FORMULA_PREFIX.test(s)) s = `'${s}`
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** RFC 4180 CSV with CRLF line endings. */
export function toCsv(header: string[], rows: Cell[][]): string {
  return [header, ...rows].map((r) => r.map(escapeCell).join(',')).join('\r\n')
}

export type CsvExportKind = 'orders' | 'customers' | 'products' | 'roasting'

function orderRows(orders: AnalyticsOrderRow[]): Cell[][] {
  return orders.map((o) => {
    const b = o.cost_breakdown
    const profit = o.total_cost === null ? null : o.total_price - o.total_cost
    return [
      o.id,
      o.order_date,
      o.customer_name,
      o.company_name,
      o.partner_id || o.company_name ? 'b2b' : 'retail',
      o.coffee,
      o.varietal,
      o.roast_level,
      o.preparation_method,
      o.amount_grams,
      o.bag_count,
      o.total_price,
      o.total_cost,
      profit,
      profit === null || o.total_price === 0 ? null : (profit / o.total_price) * 100,
      b?.coffee,
      b?.bag,
      b?.sticker,
      b?.electricity,
      b?.fuel,
      b ? (Number(b.labor) || 0) + (Number(b.roasting_time) || 0) : null,
      o.payment_status,
      o.fulfillment_status
    ]
  })
}

export function buildCsv(kind: CsvExportKind, dataset: AnalyticsDataset, report: AnalyticsReport): string {
  switch (kind) {
    case 'orders':
      return toCsv(
        [
          'order_id', 'order_date', 'customer', 'company', 'channel', 'coffee', 'varietal', 'roast_level',
          'preparation_method', 'grams', 'bags', 'revenue', 'cost', 'profit', 'margin_pct',
          'cost_coffee', 'cost_bag', 'cost_sticker', 'cost_electricity', 'cost_fuel', 'cost_labor',
          'payment_status', 'fulfillment_status'
        ],
        orderRows(dataset.orders)
      )
    case 'customers':
      return toCsv(
        [
          'customer_id', 'customer', 'orders', 'grams', 'revenue', 'profit', 'avg_order_value',
          'first_order', 'last_order', 'lifetime_orders', 'new_in_period', 'churn_risk'
        ],
        report.customers.all.map((c) => [
          c.id, c.name, c.orders, c.grams, c.revenue, c.profit, c.aov,
          c.firstOrder, c.lastOrder, c.lifetimeOrders, c.isNew,
          report.customers.atRisk.some((r) => r.id === c.id)
        ])
      )
    case 'products':
      return toCsv(
        ['dimension', 'name', 'varietal', 'orders', 'grams', 'revenue', 'cost', 'profit', 'margin_pct', 'revenue_share_pct'],
        (['coffee', 'roast', 'prep'] as const).flatMap((dimension) =>
          report.mix[dimension].map((m) => [
            dimension, m.name, m.detail, m.orders, m.grams, m.revenue, m.cost, m.profit, m.margin, m.share
          ])
        )
      )
    case 'roasting':
      return toCsv(
        ['job_id', 'created_at', 'partner', 'status', 'green_grams_in', 'roasted_grams_out', 'revenue'],
        dataset.roasting.map((r) => [
          r.id, r.created_at, r.partner_name, r.status, r.green_grams_in, r.roasted_grams_out, r.total_cost
        ])
      )
  }
}

/** Builds the CSV and triggers a browser download. */
export function downloadAnalyticsCsv(kind: CsvExportKind, dataset: AnalyticsDataset, report: AnalyticsReport) {
  const { startDate, endDate } = dataset.filters
  const range = startDate || endDate ? `-${startDate || 'start'}_${endDate || 'today'}` : '-all'
  // BOM so Excel detects UTF-8 (accented names).
  const blob = new Blob(['﻿', buildCsv(kind, dataset, report)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dos-tazas-${kind}${range}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
