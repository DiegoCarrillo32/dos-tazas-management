import { describe, it, expect } from 'vitest'
import {
  bucketStart,
  computeAnalytics,
  computeCosts,
  computeCustomers,
  computeKpis,
  computeReceivables,
  computeTrend,
  groupMix,
  pctChange,
  pickGranularity,
  localDayKey
} from './analytics-insights'
import { toCsv } from './exportAnalyticsCsv'
import type { AnalyticsDataset, AnalyticsOrderRow } from '@/types'

let seq = 0
function order(overrides: Partial<AnalyticsOrderRow> = {}): AnalyticsOrderRow {
  seq++
  return {
    id: `o${seq}`,
    order_date: new Date(2026, 8, 10, 12).toISOString(),
    customer_id: 'c1',
    customer_name: 'Ana',
    company_name: null,
    partner_id: null,
    roast_level: 'Medium',
    preparation_method: 'Whole Bean',
    origin: 'Tarrazú',
    amount_grams: 500,
    bag_count: 1,
    total_price: 100,
    total_cost: 60,
    cost_breakdown: null,
    payment_status: 'paid',
    fulfillment_status: 'delivered',
    ...overrides
  }
}

const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12).toISOString()

describe('pctChange', () => {
  it('returns null without a base', () => {
    expect(pctChange(10, 0)).toBeNull()
    expect(pctChange(10, null)).toBeNull()
  })
  it('computes signed change', () => {
    expect(pctChange(150, 100)).toBe(50)
    expect(pctChange(50, 100)).toBe(-50)
  })
})

describe('computeKpis', () => {
  it('sums revenue, cost and derived ratios', () => {
    const k = computeKpis([order(), order({ customer_id: 'c2', total_price: 300, total_cost: null, amount_grams: 1500 })])
    expect(k.revenue).toBe(400)
    expect(k.cost).toBe(60)
    expect(k.profit).toBe(340)
    expect(k.margin).toBe(85)
    expect(k.aov).toBe(200)
    expect(k.revenuePerKg).toBe(200)
    expect(k.customers).toBe(2)
    expect(k.uncostedOrders).toBe(1)
  })
  it('has null margin without revenue', () => {
    expect(computeKpis([]).margin).toBeNull()
  })
})

describe('trend bucketing', () => {
  it('picks granularity from range length', () => {
    expect(pickGranularity(31)).toBe('day')
    expect(pickGranularity(90)).toBe('week')
    expect(pickGranularity(365)).toBe('month')
  })

  it('starts weeks on Monday', () => {
    // 2026-09-13 is a Sunday
    expect(localDayKey(bucketStart(new Date(2026, 8, 13), 'week'))).toBe('2026-09-07')
  })

  it('fills empty days and sorts chronologically', () => {
    const { granularity, trend } = computeTrend(
      [order({ order_date: at(2026, 9, 3) }), order({ order_date: at(2026, 9, 1), total_price: 50, total_cost: 20 })],
      { start: '2026-09-01', end: '2026-09-05' }
    )
    expect(granularity).toBe('day')
    expect(trend.map((t) => t.key)).toEqual(['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05'])
    expect(trend[0]).toMatchObject({ revenue: 50, profit: 30, orders: 1 })
    expect(trend[1].orders).toBe(0)
  })
})

describe('groupMix', () => {
  it('computes per-group margin and revenue share', () => {
    const mix = groupMix(
      [order({ origin: 'A', total_price: 300, total_cost: 100 }), order({ origin: 'B', total_price: 100, total_cost: 90 })],
      (o) => o.origin ?? ''
    )
    expect(mix[0]).toMatchObject({ name: 'A', share: 75 })
    expect(mix[0].margin).toBeCloseTo(66.67, 1)
    expect(mix[1].margin).toBeCloseTo(10)
  })
})

describe('computeCustomers', () => {
  const now = new Date(2026, 8, 30)

  it('flags repeat customers who went quiet as churn risks', () => {
    const history = [
      { customer_id: 'c1', customer_name: 'Ana', order_date: at(2026, 6, 1), total_price: 100 },
      { customer_id: 'c1', customer_name: 'Ana', order_date: at(2026, 6, 15), total_price: 100 },
      { customer_id: 'c1', customer_name: 'Ana', order_date: at(2026, 7, 1), total_price: 100 },
      // Regular buyer, ordered recently
      { customer_id: 'c2', customer_name: 'Beto', order_date: at(2026, 9, 10), total_price: 50 },
      { customer_id: 'c2', customer_name: 'Beto', order_date: at(2026, 9, 24), total_price: 50 },
      // One-off buyer — no interval to judge
      { customer_id: 'c3', customer_name: 'Cata', order_date: at(2026, 1, 1), total_price: 500 }
    ]
    const c = computeCustomers([], history, '2026-09-01', now)
    expect(c.atRisk.map((r) => r.id)).toEqual(['c1'])
    expect(c.atRisk[0]).toMatchObject({ avgInterval: 15, lifetimeRevenue: 300 })
  })

  it('splits new vs returning using lifetime first order', () => {
    const history = [
      { customer_id: 'c1', customer_name: 'Ana', order_date: at(2026, 5, 1), total_price: 100 },
      { customer_id: 'c1', customer_name: 'Ana', order_date: at(2026, 9, 5), total_price: 100 },
      { customer_id: 'c2', customer_name: 'Beto', order_date: at(2026, 9, 6), total_price: 100 }
    ]
    const orders = [
      order({ customer_id: 'c1', order_date: at(2026, 9, 5) }),
      order({ customer_id: 'c2', customer_name: 'Beto', order_date: at(2026, 9, 6) })
    ]
    const c = computeCustomers(orders, history, '2026-09-01', now)
    expect(c.newCount).toBe(1)
    expect(c.returningCount).toBe(1)
    expect(c.repeatRate).toBe(50)
  })

  it('skips new/returning without a period start', () => {
    expect(computeCustomers([order()], [], undefined, now).newCount).toBeNull()
  })
})

describe('computeReceivables', () => {
  it('ages unpaid orders into buckets', () => {
    const now = new Date(2026, 8, 30, 12)
    const r = computeReceivables(
      [
        order({ order_date: at(2026, 9, 25), total_price: 10 }),
        order({ order_date: at(2026, 9, 10), total_price: 20 }),
        order({ order_date: at(2026, 8, 20), total_price: 30 }),
        order({ order_date: at(2026, 6, 1), total_price: 40 })
      ],
      now
    )
    expect(r.total).toBe(100)
    expect(r.aging.map((a) => a.amount)).toEqual([10, 20, 30, 40])
  })
})

describe('computeCosts', () => {
  it('folds legacy roasting_time into labor', () => {
    const costs = computeCosts([
      order({ cost_breakdown: { coffee: 50, bag: 5, sticker: 1, electricity: 2, fuel: 2, labor: 10 } }),
      order({ cost_breakdown: { coffee: 50, bag: 5, sticker: 1, electricity: 2, fuel: 2, labor: 0, roasting_time: 20 } })
    ])
    expect(costs[0]).toMatchObject({ component: 'coffee', amount: 100 })
    expect(costs.find((c) => c.component === 'labor')?.amount).toBe(30)
  })
})

describe('computeAnalytics insights', () => {
  function dataset(overrides: Partial<AnalyticsDataset> = {}): AnalyticsDataset {
    return {
      filters: { startDate: '2026-09-01', endDate: '2026-09-30' },
      orders: [],
      previousOrders: [],
      history: [],
      unpaid: [],
      roasting: [],
      ...overrides
    }
  }
  const ids = (d: AnalyticsDataset) => computeAnalytics(d, new Date(2026, 8, 30)).insights.map((i) => i.id)

  it('reports revenue change against the previous period', () => {
    const d = dataset({ orders: [order({ total_price: 150 })], previousOrders: [order({ total_price: 100 })] })
    const insight = computeAnalytics(d).insights.find((i) => i.id === 'revenue_up')
    expect(insight?.params.pct).toBe(50)
  })

  it('stays quiet about patterns on thin data', () => {
    const got = ids(dataset({ orders: [order()] }))
    expect(got).not.toContain('best_weekday')
    expect(got).not.toContain('best_seller')
  })

  it('warns about overdue receivables and uncosted orders', () => {
    const got = ids(dataset({
      orders: [order({ total_cost: null })],
      unpaid: [order({ order_date: at(2026, 7, 1), payment_status: 'pending' })]
    }))
    expect(got).toContain('overdue')
    expect(got).toContain('uncosted')
  })

  it('flags an origin with a margin well below average', () => {
    const orders = [
      ...Array.from({ length: 4 }, () => order({ origin: 'Good', total_price: 100, total_cost: 40 })),
      ...Array.from({ length: 3 }, () => order({ origin: 'Thin', total_price: 100, total_cost: 90 }))
    ]
    const insight = computeAnalytics(dataset({ orders })).insights.find((i) => i.id === 'weak_margin')
    expect(insight?.params.name).toBe('Thin')
  })
})

describe('toCsv', () => {
  it('quotes separators, quotes and newlines', () => {
    expect(toCsv(['a', 'b'], [['x,y', 'say "hi"'], ['line\nbreak', null]])).toBe(
      'a,b\r\n"x,y","say ""hi"""\r\n"line\nbreak",'
    )
  })
  it('neutralises formula injection but keeps numbers', () => {
    expect(toCsv(['a', 'b'], [['=SUM(A1)', -5]])).toBe("a,b\r\n'=SUM(A1),-5")
  })
})
