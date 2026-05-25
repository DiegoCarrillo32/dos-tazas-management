import { createClient } from '@/utils/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const searchParams = request.nextUrl.searchParams
  const page = Math.max(1, Number(searchParams.get('page') || '1'))
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '10')))
  const from = (page - 1) * limit
  const to = from + limit - 1

  // Get total count
  const { count, error: countError } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('fulfillment_status', 'delivered')
    .eq('payment_status', 'paid')

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 })
  }

  // Get paginated data
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers (
        full_name,
        phone
      ),
      inventory (
        item_name
      )
    `)
    .eq('fulfillment_status', 'delivered')
    .eq('payment_status', 'paid')
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
