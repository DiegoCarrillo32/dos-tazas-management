'use server'

import { createClient } from '@/utils/supabase/server'
import type {
  AnalyticsFilters,
  AnalyticsDataset,
  AnalyticsOrderRow,
  AnalyticsHistoryRow,
  AnalyticsRoastingRow,
  CoffeeOption,
  CostBreakdown,
  FulfillmentStatus,
  PaymentStatus
} from '@/types'

const ORDER_COLUMNS = `
  id, order_date, customer_id, company_name, partner_id, roast_level,
  preparation_method, amount_grams, bag_count, total_price, total_cost,
  cost_breakdown, payment_status, fulfillment_status,
  customers ( full_name ),
  inventory ( item_name, green_coffee_lots ( varietal ) )
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

// Local midnight of a YYYY-MM-DD day, as an ISO timestamp.
function dayStart(date: string, filters: AnalyticsFilters): string {
  const offsetMs = (filters.tzOffsetMinutes ?? 0) * 60_000
  return new Date(Date.parse(`${date}T00:00:00Z`) + offsetMs).toISOString()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyDateRange(query: any, column: string, filters: AnalyticsFilters) {
  if (filters.startDate) query = query.gte(column, dayStart(filters.startDate, filters))
  // endDate is inclusive: the column is a timestamp, so bound by the next day.
  if (filters.endDate) query = query.lt(column, dayStart(addDays(filters.endDate, 1), filters))
  return query
}

const PAGE_SIZE = 1000

// PostgREST caps each response (1000 rows by default), so page until a short page.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAll(buildQuery: () => any, label: string): Promise<any[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1)
    if (error) {
      console.error(`Error fetching ${label}:`, error)
      throw new Error(`Failed to load ${label}.`)
    }
    rows.push(...(data || []))
    if (!data || data.length < PAGE_SIZE) return rows
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyAnalyticsFilters(query: any, filters: AnalyticsFilters) {
  query = applyDateRange(query, 'order_date', filters)
  if (filters.paymentStatus && filters.paymentStatus !== 'all') query = query.eq('payment_status', filters.paymentStatus)
  if (filters.fulfillmentStatus && filters.fulfillmentStatus !== 'all') query = query.eq('fulfillment_status', filters.fulfillmentStatus)
  if (filters.coffeeId === 'none') query = query.is('inventory_id', null)
  else if (filters.coffeeId && filters.coffeeId !== 'all') query = query.eq('inventory_id', filters.coffeeId)
  return query
}

// Supabase returns to-one joins as an object or a one-element array.
function one<T>(value: T | T[] | null | undefined): T | null {
  return (Array.isArray(value) ? value[0] : value) ?? null
}

type InventoryJoin = { item_name: string; green_coffee_lots?: { varietal: string | null }[] | null }

function varietalsOf(inventory: InventoryJoin | null): string | null {
  const names = new Set(
    (inventory?.green_coffee_lots ?? []).map((l) => l.varietal?.trim()).filter((v): v is string => Boolean(v))
  )
  return names.size ? [...names].sort().join(', ') : null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toOrderRow(o: any): AnalyticsOrderRow {
  const inventory = one<InventoryJoin>(o.inventory)
  return {
    id: o.id,
    order_date: o.order_date,
    customer_id: o.customer_id,
    customer_name: one<{ full_name: string }>(o.customers)?.full_name ?? '',
    company_name: o.company_name ?? null,
    partner_id: o.partner_id ?? null,
    roast_level: o.roast_level,
    preparation_method: o.preparation_method,
    coffee: inventory?.item_name ?? null,
    varietal: varietalsOf(inventory),
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
  const rows = await fetchAll(
    () => applyAnalyticsFilters(
      supabase.from('orders').select(ORDER_COLUMNS).order('order_date', { ascending: true }).order('id'),
      filters
    ),
    'analytics orders'
  )
  return rows.map(toOrderRow)
}

async function fetchHistory(): Promise<AnalyticsHistoryRow[]> {
  const supabase = await createClient()
  const rows = await fetchAll(
    () => supabase
      .from('orders')
      .select('customer_id, order_date, total_price, customers ( full_name )')
      .order('order_date', { ascending: true })
      .order('id'),
    'order history'
  )
  return rows.map((o) => ({
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
  const rows = await fetchAll(
    () => applyDateRange(
      supabase
        .from('roasting_orders')
        .select('id, created_at, status, total_cost, green_grams_in, roasted_grams_out, b2b_partners ( company_name )')
        .order('created_at', { ascending: true })
        .order('id'),
      'created_at',
      filters
    ),
    'roasting analytics'
  )
  return rows.map((r) => ({
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

/** Green-coffee inventory items, for the analytics coffee filter. */
export async function fetchCoffeeOptions(): Promise<CoffeeOption[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inventory')
    .select('id, item_name')
    .eq('category', 'green_coffee')
    .order('item_name', { ascending: true })
  if (error) {
    console.error('Error fetching coffee options:', error)
    throw new Error('Failed to load coffee options.')
  }
  return data || []
}
