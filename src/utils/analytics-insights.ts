import type {
  AnalyticsDataset,
  AnalyticsHistoryRow,
  AnalyticsOrderRow,
  AnalyticsRoastingRow,
  FulfillmentStatus
} from '@/types'

// ============================================================
// Analytics engine — turns a raw AnalyticsDataset into every metric and
// insight the dashboard shows. Pure and timezone-local (runs in the browser),
// so buckets and weekdays follow the user's clock.
// ============================================================

const DAY_MS = 86_400_000

export type Granularity = 'day' | 'week' | 'month'

export type KpiSet = {
  revenue: number
  cost: number
  profit: number
  /** Profit as % of revenue; null with no revenue. */
  margin: number | null
  orders: number
  grams: number
  aov: number
  revenuePerKg: number
  costPerKg: number
  customers: number
  /** Orders with no recorded cost — their profit is overstated. */
  uncostedOrders: number
}

export type TrendPoint = {
  /** Local YYYY-MM-DD of the bucket's first day. */
  key: string
  revenue: number
  cost: number
  profit: number
  orders: number
  grams: number
}

export type MixRow = {
  name: string
  revenue: number
  cost: number
  profit: number
  margin: number | null
  grams: number
  orders: number
  /** Share of total revenue, 0–100. */
  share: number
}

export type CustomerStat = {
  id: string
  name: string
  revenue: number
  profit: number
  orders: number
  grams: number
  aov: number
  lastOrder: string
  firstOrder: string
  /** First-ever order falls inside the selected period. */
  isNew: boolean
  lifetimeOrders: number
}

export type AtRiskCustomer = {
  id: string
  name: string
  lastOrder: string
  daysSince: number
  avgInterval: number
  lifetimeRevenue: number
}

export type WeekdayPoint = { day: number; revenue: number; orders: number }

export type AgingBucket = { key: '0_15' | '16_30' | '31_60' | '60_plus'; amount: number; orders: number }

export type CostComponent = 'coffee' | 'bag' | 'sticker' | 'electricity' | 'fuel' | 'labor'

export type Insight = {
  id: string
  tone: 'positive' | 'warning' | 'neutral'
  /**
   * Values for the insight's template. Rendering is by name: `amount*` is
   * money, `pct*` a percentage, `kg` kilograms, `day` a weekday index.
   */
  params: Record<string, string | number>
}

export type AnalyticsReport = {
  kpis: KpiSet
  previousKpis: KpiSet | null
  granularity: Granularity
  trend: TrendPoint[]
  mix: { roast: MixRow[]; prep: MixRow[]; origin: MixRow[] }
  channel: { retail: MixRow; b2b: MixRow; partners: MixRow[]; previousB2bShare: number | null }
  customers: {
    all: CustomerStat[]
    newCount: number | null
    returningCount: number | null
    /** % of active customers with 2+ lifetime orders. */
    repeatRate: number | null
    /** % of revenue from the top 20% of customers. */
    top20Share: number | null
    atRisk: AtRiskCustomer[]
  }
  weekdays: WeekdayPoint[]
  receivables: { total: number; orders: number; aging: AgingBucket[] }
  pipeline: { status: FulfillmentStatus; orders: number; grams: number }[]
  costs: { component: CostComponent; amount: number; share: number }[]
  roasting: {
    revenue: number
    jobs: number
    roastedGrams: number
    byStatus: { status: string; jobs: number; revenue: number }[]
    byPartner: { name: string; revenue: number; jobs: number }[]
  }
  insights: Insight[]
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

const round2 = (n: number) => Math.round(n * 100) / 100
const pct = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0)

/** % change from previous to current; null when there is no base to compare. */
export function pctChange(current: number, previous: number | null | undefined): number | null {
  if (previous === null || previous === undefined || previous === 0) return null
  return ((current - previous) / Math.abs(previous)) * 100
}

export function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Parses YYYY-MM-DD as local midnight (Date.parse would use UTC). */
export function parseLocalDay(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const daysBetween = (a: Date, b: Date) => Math.floor((b.getTime() - a.getTime()) / DAY_MS)

export function pickGranularity(days: number): Granularity {
  if (days <= 31) return 'day'
  if (days <= 180) return 'week'
  return 'month'
}

/** Start of the bucket containing `d`. Weeks start on Monday. */
export function bucketStart(d: Date, granularity: Granularity): Date {
  if (granularity === 'month') return new Date(d.getFullYear(), d.getMonth(), 1)
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  if (granularity === 'week') day.setDate(day.getDate() - ((day.getDay() + 6) % 7))
  return day
}

function nextBucket(d: Date, granularity: Granularity): Date {
  if (granularity === 'month') return new Date(d.getFullYear(), d.getMonth() + 1, 1)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + (granularity === 'week' ? 7 : 1))
}

const isB2b = (o: AnalyticsOrderRow) => Boolean(o.partner_id || o.company_name)

// ------------------------------------------------------------
// Sections
// ------------------------------------------------------------

export function computeKpis(orders: AnalyticsOrderRow[]): KpiSet {
  let revenue = 0
  let cost = 0
  let grams = 0
  let uncostedOrders = 0
  const customers = new Set<string>()
  for (const o of orders) {
    revenue += o.total_price
    cost += o.total_cost ?? 0
    grams += o.amount_grams
    if (o.total_cost === null) uncostedOrders++
    customers.add(o.customer_id)
  }
  const profit = revenue - cost
  const kg = grams / 1000
  return {
    revenue: round2(revenue),
    cost: round2(cost),
    profit: round2(profit),
    margin: revenue > 0 ? pct(profit, revenue) : null,
    orders: orders.length,
    grams,
    aov: orders.length ? revenue / orders.length : 0,
    revenuePerKg: kg > 0 ? revenue / kg : 0,
    costPerKg: kg > 0 ? cost / kg : 0,
    customers: customers.size,
    uncostedOrders
  }
}

export function computeTrend(
  orders: AnalyticsOrderRow[],
  range: { start?: string; end?: string }
): { granularity: Granularity; trend: TrendPoint[] } {
  const dates = orders.map((o) => new Date(o.order_date))
  const first = range.start ? parseLocalDay(range.start) : dates[0]
  const last = range.end ? parseLocalDay(range.end) : dates[dates.length - 1]
  if (!first || !last || last < first) return { granularity: 'day', trend: [] }

  const granularity = pickGranularity(daysBetween(first, last) + 1)
  const buckets = new Map<string, TrendPoint>()
  for (let d = bucketStart(first, granularity); d <= last; d = nextBucket(d, granularity)) {
    const key = localDayKey(d)
    buckets.set(key, { key, revenue: 0, cost: 0, profit: 0, orders: 0, grams: 0 })
  }
  orders.forEach((o, i) => {
    const key = localDayKey(bucketStart(dates[i], granularity))
    const b = buckets.get(key)
    if (!b) return
    b.revenue += o.total_price
    b.cost += o.total_cost ?? 0
    b.orders += 1
    b.grams += o.amount_grams
  })
  const trend = [...buckets.values()].map((b) => ({
    ...b,
    revenue: round2(b.revenue),
    cost: round2(b.cost),
    profit: round2(b.revenue - b.cost)
  }))
  return { granularity, trend }
}

export function groupMix(orders: AnalyticsOrderRow[], keyOf: (o: AnalyticsOrderRow) => string): MixRow[] {
  const total = orders.reduce((s, o) => s + o.total_price, 0)
  const groups = new Map<string, MixRow>()
  for (const o of orders) {
    const name = keyOf(o)
    const g = groups.get(name) ?? { name, revenue: 0, cost: 0, profit: 0, margin: null, grams: 0, orders: 0, share: 0 }
    g.revenue += o.total_price
    g.cost += o.total_cost ?? 0
    g.grams += o.amount_grams
    g.orders += 1
    groups.set(name, g)
  }
  return [...groups.values()]
    .map((g) => ({
      ...g,
      revenue: round2(g.revenue),
      cost: round2(g.cost),
      profit: round2(g.revenue - g.cost),
      margin: g.revenue > 0 ? pct(g.revenue - g.cost, g.revenue) : null,
      share: pct(g.revenue, total)
    }))
    .sort((a, b) => b.revenue - a.revenue)
}

export function computeCustomers(
  orders: AnalyticsOrderRow[],
  history: AnalyticsHistoryRow[],
  periodStart: string | undefined,
  now: Date
): AnalyticsReport['customers'] {
  const lifetime = new Map<string, { name: string; dates: number[]; revenue: number }>()
  for (const h of history) {
    const c = lifetime.get(h.customer_id) ?? { name: h.customer_name, dates: [], revenue: 0 }
    c.dates.push(new Date(h.order_date).getTime())
    c.revenue += h.total_price
    lifetime.set(h.customer_id, c)
  }
  for (const c of lifetime.values()) c.dates.sort((a, b) => a - b)

  const start = periodStart ? parseLocalDay(periodStart).getTime() : null
  const stats = new Map<string, CustomerStat>()
  for (const o of orders) {
    const life = lifetime.get(o.customer_id)
    const firstOrder = life ? new Date(life.dates[0]).toISOString() : o.order_date
    const s = stats.get(o.customer_id) ?? {
      id: o.customer_id,
      name: o.customer_name,
      revenue: 0,
      profit: 0,
      orders: 0,
      grams: 0,
      aov: 0,
      lastOrder: o.order_date,
      firstOrder,
      isNew: start !== null && new Date(firstOrder).getTime() >= start,
      lifetimeOrders: life?.dates.length ?? 1
    }
    s.revenue += o.total_price
    s.profit += o.total_price - (o.total_cost ?? 0)
    s.orders += 1
    s.grams += o.amount_grams
    if (o.order_date > s.lastOrder) s.lastOrder = o.order_date
    stats.set(o.customer_id, s)
  }
  const all = [...stats.values()]
    .map((s) => ({ ...s, revenue: round2(s.revenue), profit: round2(s.profit), aov: s.orders ? s.revenue / s.orders : 0 }))
    .sort((a, b) => b.revenue - a.revenue)

  const total = all.reduce((s, c) => s + c.revenue, 0)
  const topN = Math.max(1, Math.ceil(all.length * 0.2))
  const newCount = start === null ? null : all.filter((c) => c.isNew).length

  // Churn risk: a repeat customer who has gone quiet for more than twice
  // their usual gap between orders (never less than two weeks).
  const atRisk: AtRiskCustomer[] = []
  for (const [id, c] of lifetime) {
    const days = [...new Set(c.dates.map((t) => localDayKey(new Date(t))))]
    if (days.length < 2) continue
    const first = parseLocalDay(days[0])
    const last = parseLocalDay(days[days.length - 1])
    const avgInterval = daysBetween(first, last) / (days.length - 1)
    const daysSince = daysBetween(last, now)
    if (daysSince > Math.max(2 * avgInterval, 14)) {
      atRisk.push({
        id,
        name: c.name,
        lastOrder: new Date(c.dates[c.dates.length - 1]).toISOString(),
        daysSince,
        avgInterval: Math.round(avgInterval),
        lifetimeRevenue: round2(c.revenue)
      })
    }
  }
  atRisk.sort((a, b) => b.lifetimeRevenue - a.lifetimeRevenue)

  return {
    all,
    newCount,
    returningCount: newCount === null ? null : all.length - newCount,
    repeatRate: all.length ? pct(all.filter((c) => c.lifetimeOrders >= 2).length, all.length) : null,
    top20Share: all.length >= 5 ? pct(all.slice(0, topN).reduce((s, c) => s + c.revenue, 0), total) : null,
    atRisk
  }
}

export function computeWeekdays(orders: AnalyticsOrderRow[]): WeekdayPoint[] {
  // Monday first.
  const days = [1, 2, 3, 4, 5, 6, 0].map((day) => ({ day, revenue: 0, orders: 0 }))
  for (const o of orders) {
    const d = days.find((w) => w.day === new Date(o.order_date).getDay())!
    d.revenue += o.total_price
    d.orders += 1
  }
  return days.map((d) => ({ ...d, revenue: round2(d.revenue) }))
}

export function computeReceivables(unpaid: AnalyticsOrderRow[], now: Date): AnalyticsReport['receivables'] {
  const aging: AgingBucket[] = [
    { key: '0_15', amount: 0, orders: 0 },
    { key: '16_30', amount: 0, orders: 0 },
    { key: '31_60', amount: 0, orders: 0 },
    { key: '60_plus', amount: 0, orders: 0 }
  ]
  let total = 0
  for (const o of unpaid) {
    const age = daysBetween(new Date(o.order_date), now)
    const bucket = age <= 15 ? aging[0] : age <= 30 ? aging[1] : age <= 60 ? aging[2] : aging[3]
    bucket.amount += o.total_price
    bucket.orders += 1
    total += o.total_price
  }
  return { total: round2(total), orders: unpaid.length, aging: aging.map((a) => ({ ...a, amount: round2(a.amount) })) }
}

export function computePipeline(orders: AnalyticsOrderRow[]): AnalyticsReport['pipeline'] {
  return (['pending', 'roasted', 'delivered'] as FulfillmentStatus[]).map((status) => {
    const rows = orders.filter((o) => o.fulfillment_status === status)
    return { status, orders: rows.length, grams: rows.reduce((s, o) => s + o.amount_grams, 0) }
  })
}

export function computeCosts(orders: AnalyticsOrderRow[]): AnalyticsReport['costs'] {
  const sums: Record<CostComponent, number> = { coffee: 0, bag: 0, sticker: 0, electricity: 0, fuel: 0, labor: 0 }
  for (const o of orders) {
    const b = o.cost_breakdown
    if (!b) continue
    sums.coffee += Number(b.coffee) || 0
    sums.bag += Number(b.bag) || 0
    sums.sticker += Number(b.sticker) || 0
    sums.electricity += Number(b.electricity) || 0
    sums.fuel += Number(b.fuel) || 0
    // Orders saved before the labor model carry `roasting_time` instead.
    sums.labor += (Number(b.labor) || 0) + (Number(b.roasting_time) || 0)
  }
  const total = Object.values(sums).reduce((s, v) => s + v, 0)
  return (Object.keys(sums) as CostComponent[])
    .map((component) => ({ component, amount: round2(sums[component]), share: pct(sums[component], total) }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)
}

export function computeRoasting(rows: AnalyticsRoastingRow[]): AnalyticsReport['roasting'] {
  const active = rows.filter((r) => r.status !== 'cancelled')
  const byStatus = new Map<string, { status: string; jobs: number; revenue: number }>()
  for (const r of rows) {
    const s = byStatus.get(r.status) ?? { status: r.status, jobs: 0, revenue: 0 }
    s.jobs += 1
    s.revenue += r.total_cost
    byStatus.set(r.status, s)
  }
  const byPartner = new Map<string, { name: string; revenue: number; jobs: number }>()
  for (const r of active) {
    const name = r.partner_name ?? ''
    const p = byPartner.get(name) ?? { name, revenue: 0, jobs: 0 }
    p.revenue += r.total_cost
    p.jobs += 1
    byPartner.set(name, p)
  }
  return {
    revenue: round2(active.reduce((s, r) => s + r.total_cost, 0)),
    jobs: active.length,
    roastedGrams: active.reduce((s, r) => s + r.roasted_grams_out, 0),
    byStatus: [...byStatus.values()].map((s) => ({ ...s, revenue: round2(s.revenue) })),
    byPartner: [...byPartner.values()].map((p) => ({ ...p, revenue: round2(p.revenue) })).sort((a, b) => b.revenue - a.revenue)
  }
}

// ------------------------------------------------------------
// Insights — rule-based observations, each only when the data supports it.
// ------------------------------------------------------------

const MIN_ORDERS_FOR_PATTERNS = 7
const MIN_ORDERS_PER_PRODUCT = 3

export function buildInsights(report: Omit<AnalyticsReport, 'insights'>): Insight[] {
  const { kpis, previousKpis, mix, channel, customers, weekdays, receivables, pipeline, costs } = report
  const insights: Insight[] = []

  const revenueChange = pctChange(kpis.revenue, previousKpis?.revenue)
  if (revenueChange !== null) {
    insights.push({
      id: revenueChange >= 0 ? 'revenue_up' : 'revenue_down',
      tone: revenueChange >= 0 ? 'positive' : 'warning',
      params: { pct: Math.abs(revenueChange), amount: Math.abs(kpis.revenue - previousKpis!.revenue) }
    })
  }

  if (kpis.margin !== null && previousKpis?.margin !== null && previousKpis?.margin !== undefined) {
    const diff = kpis.margin - previousKpis.margin
    if (Math.abs(diff) >= 2) {
      insights.push({
        id: diff >= 0 ? 'margin_up' : 'margin_down',
        tone: diff >= 0 ? 'positive' : 'warning',
        params: { pts: Math.abs(diff).toFixed(1), pct: kpis.margin }
      })
    }
  }

  const products = mix.origin.some((m) => m.name) ? mix.origin : mix.roast
  const best = products.find((m) => m.name)
  if (best && kpis.orders >= MIN_ORDERS_FOR_PATTERNS) {
    insights.push({ id: 'best_seller', tone: 'neutral', params: { name: best.name, pct: best.share } })
  }

  const avgMargin = kpis.margin
  const weakest = products
    .filter((m) => m.name && m.orders >= MIN_ORDERS_PER_PRODUCT && m.margin !== null)
    .sort((a, b) => a.margin! - b.margin!)[0]
  if (weakest && avgMargin !== null && weakest.margin! < avgMargin - 5) {
    insights.push({
      id: 'weak_margin',
      tone: 'warning',
      params: { name: weakest.name, pct: weakest.margin!, pctAvg: avgMargin }
    })
  }

  if (customers.top20Share !== null) {
    insights.push({
      id: customers.top20Share >= 60 ? 'concentration_high' : 'concentration',
      tone: customers.top20Share >= 60 ? 'warning' : 'neutral',
      params: { pct: customers.top20Share }
    })
  }

  if (customers.newCount !== null && customers.newCount > 0) {
    insights.push({ id: 'new_customers', tone: 'positive', params: { count: customers.newCount } })
  }

  if (customers.atRisk.length > 0) {
    insights.push({
      id: 'churn_risk',
      tone: 'warning',
      params: {
        count: customers.atRisk.length,
        name: customers.atRisk[0].name,
        amount: customers.atRisk.reduce((s, c) => s + c.lifetimeRevenue, 0)
      }
    })
  }

  if (kpis.orders >= MIN_ORDERS_FOR_PATTERNS) {
    const top = [...weekdays].sort((a, b) => b.revenue - a.revenue)[0]
    insights.push({ id: 'best_weekday', tone: 'neutral', params: { day: top.day, pct: pct(top.revenue, kpis.revenue) } })
  }

  const overdue = receivables.aging.filter((a) => a.key === '31_60' || a.key === '60_plus')
  const overdueAmount = overdue.reduce((s, a) => s + a.amount, 0)
  if (overdueAmount > 0) {
    insights.push({
      id: 'overdue',
      tone: 'warning',
      params: { amount: overdueAmount, count: overdue.reduce((s, a) => s + a.orders, 0) }
    })
  }

  if (channel.b2b.orders > 0 && kpis.revenue > 0) {
    const share = channel.b2b.share
    const change = channel.previousB2bShare === null ? null : share - channel.previousB2bShare
    insights.push({
      id: change !== null && Math.abs(change) >= 5 ? (change > 0 ? 'b2b_share_up' : 'b2b_share_down') : 'b2b_share',
      tone: 'neutral',
      params: { pct: share, pts: change === null ? 0 : Math.abs(change).toFixed(1) }
    })
  }

  if (costs.length > 0) {
    insights.push({ id: 'cost_driver', tone: 'neutral', params: { component: costs[0].component, pct: costs[0].share } })
  }

  const toRoast = pipeline.find((p) => p.status === 'pending')
  if (toRoast && toRoast.grams > 0) {
    insights.push({ id: 'pending_roast', tone: 'neutral', params: { kg: toRoast.grams / 1000, count: toRoast.orders } })
  }

  if (kpis.uncostedOrders > 0) {
    insights.push({ id: 'uncosted', tone: 'warning', params: { count: kpis.uncostedOrders } })
  }

  return insights
}

// ------------------------------------------------------------
// Entry point
// ------------------------------------------------------------

export function computeAnalytics(dataset: AnalyticsDataset, now: Date = new Date()): AnalyticsReport {
  const { orders, previousOrders, filters } = dataset
  const kpis = computeKpis(orders)
  const previousKpis = previousOrders ? computeKpis(previousOrders) : null
  const { granularity, trend } = computeTrend(orders, { start: filters.startDate, end: filters.endDate })

  const channelMix = groupMix(orders, (o) => (isB2b(o) ? 'b2b' : 'retail'))
  const [retail, b2b] = (['retail', 'b2b'] as const).map(
    (name) =>
      channelMix.find((m) => m.name === name) ??
      { name, revenue: 0, cost: 0, profit: 0, margin: null, grams: 0, orders: 0, share: 0 }
  )
  const previousB2bShare = previousOrders?.length
    ? pct(
        previousOrders.filter(isB2b).reduce((s, o) => s + o.total_price, 0),
        previousOrders.reduce((s, o) => s + o.total_price, 0)
      )
    : null

  const partial = {
    kpis,
    previousKpis,
    granularity,
    trend,
    mix: {
      roast: groupMix(orders, (o) => o.roast_level),
      prep: groupMix(orders, (o) => o.preparation_method),
      origin: groupMix(orders, (o) => o.origin ?? '')
    },
    channel: {
      retail,
      b2b,
      partners: groupMix(orders.filter(isB2b), (o) => o.company_name || o.customer_name),
      previousB2bShare
    },
    customers: computeCustomers(orders, dataset.history, filters.startDate, now),
    weekdays: computeWeekdays(orders),
    receivables: computeReceivables(dataset.unpaid, now),
    pipeline: computePipeline(orders),
    costs: computeCosts(orders),
    roasting: computeRoasting(dataset.roasting)
  }

  return { ...partial, insights: buildInsights(partial) }
}
