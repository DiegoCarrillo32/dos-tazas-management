import { createClient } from '@/utils/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const searchParams = request.nextUrl.searchParams
  const page = Math.max(1, parseInt(searchParams.get('page') || '', 10) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '', 10) || 10))
  // Strip characters that have meaning in PostgREST filter syntax.
  const q = (searchParams.get('q') || '').replace(/[%,()*\\]/g, ' ').trim()
  const from = (page - 1) * limit
  const to = from + limit - 1

  // Searching filters on the joined customer, so it must be an inner join.
  const customerJoin = q ? 'customers!inner' : 'customers'
  let query = supabase
    .from('orders')
    .select(`
      *,
      ${customerJoin} (
        full_name,
        phone
      ),
      inventory (
        item_name
      )
    `, { count: 'exact' })
    .eq('fulfillment_status', 'delivered')
    .eq('payment_status', 'paid')

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`, { referencedTable: 'customers' })
  }

  const { data: orders, count, error } = await query
    .order('order_date', { ascending: false })
    .range(from, to)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const mapped = (orders || []).map(order => ({
    ...order,
    customers: Array.isArray(order.customers) ? order.customers[0] : order.customers,
    inventory: Array.isArray(order.inventory) ? order.inventory[0] : order.inventory
  }))

  return NextResponse.json({ data: mapped, total: count || 0 })
}
