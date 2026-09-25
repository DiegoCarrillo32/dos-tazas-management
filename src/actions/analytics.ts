'use server'

import { createClient } from '@/utils/supabase/server'
import type {
  AnalyticsFilters,
  AnalyticsDataset,
  AnalyticsOrderRow,
  AnalyticsHistoryRow,
  AnalyticsRoastingRow,
  CostBreakdown,
  FulfillmentStatus,
  PaymentStatus
} from '@/types'

const ORDER_COLUMNS = `
  id, order_date, customer_id, company_name, partner_id, roast_level,
  preparation_method, amount_grams, bag_count, total_price, total_cost,
  cost_breakdown, payment_status, fulfillment_status,
  customers ( full_name ),
  inventory ( item_name )
`

const DAY_MS = 86_400_000

// Shifts a YYYY-MM-DD date by whole days.
function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10)
}

// The period of equal length immediately before [startDate, endDate].
function previousPeriod(filters: AnalyticsFilters): AnalyticsFilters | null {
  if (!filters.startDate || !filters.endDate) return null
  const days = Math.round((Date.parse(filters.endDate) - Date.parse(filters.startDate)) / DAY_MS) + 1
  if (days <= 0) return null
  return {
    ...filters,
    startDate: addDays(filters.startDate, -days),
    endDate: addDays(filters.startDate, -1)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyAnalyticsFilters(query: any, filters: AnalyticsFilters) {
  if (filters.startDate) query = query.gte('order_date', filters.startDate)
  // endDate is inclusive: order_date is a timestamp, so bound by the next day.
  if (filters.endDate) query = query.lt('order_date', addDays(filters.endDate, 1))
  if (filters.paymentStatus && filters.paymentStatus !== 'all') query = query.eq('payment_status', filters.paymentStatus)
  if (filters.fulfillmentStatus && filters.fulfillmentStatus !== 'all') query = query.eq('fulfillment_status', filters.fulfillmentStatus)
  return query
}

// Supabase returns to-one joins as an object or a one-element array.
function one<T>(value: T | T[] | null | undefined): T | null {
  return (Array.isArray(value) ? value[0] : value) ?? null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toOrderRow(o: any): AnalyticsOrderRow {
  return {
    id: o.id,
    order_date: o.order_date,
    customer_id: o.customer_id,
    customer_name: one<{ full_name: string }>(o.customers)?.full_name ?? '',
    company_name: o.company_name ?? null,
    partner_id: o.partner_id ?? null,
    roast_level: o.roast_level,
    preparation_method: o.preparation_method,
    origin: one<{ item_name: string }>(o.inventory)?.item_name ?? null,
    amount_grams: Number(o.amount_grams) || 0,
    bag_count: Number(o.bag_count) || 0,
    total_price: Number(o.total_price) || 0,
    total_cost: o.total_cost === null || o.total_cost === undefined ? null : Number(o.total_cost),
    cost_breakdown: (o.cost_breakdown as CostBreakdown | null) ?? null,
    payment_status: o.payment_status as PaymentStatus,
    fulfillment_status: o.fulfillment_status as FulfillmentStatus
  }
}

async function fetchOrderRows(filters: AnalyticsFilters): Promise<AnalyticsOrderRow[]> {
  const supabase = await createClient()
  let query = supabase.from('orders').select(ORDER_COLUMNS).order('order_date', { ascending: true })
  query = applyAnalyticsFilters(query, filters)
  const { data, error } = await query
  if (error) {
    console.error('Error fetching analytics orders:', error)
    return []
  }
  return (data || []).map(toOrderRow)
}

async function fetchHistory(): Promise<AnalyticsHistoryRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('customer_id, order_date, total_price, customers ( full_name )')
    .order('order_date', { ascending: true })
  if (error) {
    console.error('Error fetching order history:', error)
    return []
  }
  return (data || []).map((o) => ({
    customer_id: o.customer_id,
    customer_name: one<{ full_name: string }>(o.customers)?.full_name ?? '',
    order_date: o.order_date,
    total_price: Number(o.total_price) || 0
  }))
}

async function fetchRoastingRows(filters: AnalyticsFilters): Promise<AnalyticsRoastingRow[]> {
  const supabase = await createClient()

  // Roasting orders are dated by created_at and have their own lifecycle, so
  // only the date range applies here (payment/fulfillment filters are
  // order-specific).
  let query = supabase
    .from('roasting_orders')
    .select('id, created_at, status, total_cost, green_grams_in, roasted_grams_out, b2b_partners ( company_name )')
    .order('created_at', { ascending: true })

  if (filters.startDate) query = query.gte('created_at', filters.startDate)
  if (filters.endDate) query = query.lt('created_at', addDays(filters.endDate, 1))

  const { data, error } = await query
  if (error) {
    console.error('Error fetching roasting analytics:', error)
    return []
  }
  return (data || []).map((r) => ({
    id: r.id,
    created_at: r.created_at,
    partner_name: one<{ company_name: string }>(r.b2b_partners)?.company_name ?? null,
    status: r.status,
    total_cost: Number(r.total_cost) || 0,
    green_grams_in: Number(r.green_grams_in) || 0,
    roasted_grams_out: Number(r.roasted_grams_out) || 0
  }))
}

export async function fetchAnalyticsDataset(
  filters: AnalyticsFilters = {}
): Promise<AnalyticsDataset> {
  const previous = previousPeriod(filters)

  const [orders, previousOrders, history, unpaid, roasting] = await Promise.all([
    fetchOrderRows(filters),
    previous ? fetchOrderRows(previous) : Promise.resolve(null),
    fetchHistory(),
    fetchOrderRows({ paymentStatus: 'pending' }),
    fetchRoastingRows(filters)
  ])

  return { filters, orders, previousOrders, history, unpaid, roasting }
}
