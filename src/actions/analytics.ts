'use server'

import { createClient } from '@/utils/supabase/server'
import type {
  AnalyticsFilters,
  AnalyticsSummary,
  RevenueDataPoint,
  BreakdownItem
} from '@/types'

export async function fetchAnalyticsSummary(
  filters: AnalyticsFilters = {}
): Promise<AnalyticsSummary> {
  const supabase = await createClient()

  let query = supabase.from('orders').select('total_price, amount_grams')

  if (filters.startDate) query = query.gte('order_date', filters.startDate)
  if (filters.endDate) query = query.lte('order_date', filters.endDate)
  if (filters.paymentStatus && filters.paymentStatus !== 'all') query = query.eq('payment_status', filters.paymentStatus)
  if (filters.fulfillmentStatus && filters.fulfillmentStatus !== 'all') query = query.eq('fulfillment_status', filters.fulfillmentStatus)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching analytics summary:', error)
    return { totalRevenue: 0, totalCoffeeSoldGrams: 0, totalOrders: 0 }
  }

  const orders = data || []
  return {
    totalRevenue: orders.reduce((sum, o) => sum + Number(o.total_price), 0),
    totalCoffeeSoldGrams: orders.reduce((sum, o) => sum + Number(o.amount_grams), 0),
    totalOrders: orders.length
  }
}

export async function fetchRevenueTimeSeries(
  filters: AnalyticsFilters = {}
): Promise<RevenueDataPoint[]> {
  const supabase = await createClient()

  let query = supabase
    .from('orders')
    .select('order_date, total_price')
    .order('order_date', { ascending: true })

  if (filters.startDate) query = query.gte('order_date', filters.startDate)
  if (filters.endDate) query = query.lte('order_date', filters.endDate)
  if (filters.paymentStatus && filters.paymentStatus !== 'all') query = query.eq('payment_status', filters.paymentStatus)
  if (filters.fulfillmentStatus && filters.fulfillmentStatus !== 'all') query = query.eq('fulfillment_status', filters.fulfillmentStatus)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching revenue time series:', error)
    return []
  }

  // Group by date
  const grouped = new Map<string, { revenue: number; orders: number }>()
  for (const order of data || []) {
    const date = new Date(order.order_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
    const existing = grouped.get(date) || { revenue: 0, orders: 0 }
    existing.revenue += Number(order.total_price)
    existing.orders += 1
    grouped.set(date, existing)
  }

  return Array.from(grouped.entries()).map(([date, vals]) => ({
    date,
    revenue: Math.round(vals.revenue * 100) / 100,
    orders: vals.orders
  }))
}

export async function fetchTopRoastLevels(
  filters: AnalyticsFilters = {}
): Promise<BreakdownItem[]> {
  const supabase = await createClient()

  let query = supabase
    .from('orders')
    .select('roast_level, amount_grams')

  if (filters.startDate) query = query.gte('order_date', filters.startDate)
  if (filters.endDate) query = query.lte('order_date', filters.endDate)
  if (filters.paymentStatus && filters.paymentStatus !== 'all') query = query.eq('payment_status', filters.paymentStatus)
  if (filters.fulfillmentStatus && filters.fulfillmentStatus !== 'all') query = query.eq('fulfillment_status', filters.fulfillmentStatus)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching roast level breakdown:', error)
    return []
  }

  const grouped = new Map<string, { value: number; count: number }>()
  for (const order of data || []) {
    const existing = grouped.get(order.roast_level) || { value: 0, count: 0 }
    existing.value += Number(order.amount_grams)
    existing.count += 1
    grouped.set(order.roast_level, existing)
  }

  return Array.from(grouped.entries())
    .map(([name, vals]) => ({ name, value: vals.value, count: vals.count }))
    .sort((a, b) => b.value - a.value)
}

export async function fetchTopPrepMethods(
  filters: AnalyticsFilters = {}
): Promise<BreakdownItem[]> {
  const supabase = await createClient()

  let query = supabase
    .from('orders')
    .select('preparation_method, amount_grams')

  if (filters.startDate) query = query.gte('order_date', filters.startDate)
  if (filters.endDate) query = query.lte('order_date', filters.endDate)
  if (filters.paymentStatus && filters.paymentStatus !== 'all') query = query.eq('payment_status', filters.paymentStatus)
  if (filters.fulfillmentStatus && filters.fulfillmentStatus !== 'all') query = query.eq('fulfillment_status', filters.fulfillmentStatus)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching prep method breakdown:', error)
    return []
  }

  const grouped = new Map<string, { value: number; count: number }>()
  for (const order of data || []) {
    const existing = grouped.get(order.preparation_method) || { value: 0, count: 0 }
    existing.value += Number(order.amount_grams)
    existing.count += 1
    grouped.set(order.preparation_method, existing)
  }

  return Array.from(grouped.entries())
    .map(([name, vals]) => ({ name, value: vals.value, count: vals.count }))
    .sort((a, b) => b.value - a.value)
}
