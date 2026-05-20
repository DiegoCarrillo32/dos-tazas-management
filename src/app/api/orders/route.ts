import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

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
    .or('fulfillment_status.neq.delivered,payment_status.neq.paid')
    .order('order_date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const mapped = (orders || []).map(order => ({
    ...order,
    customers: Array.isArray(order.customers) ? order.customers[0] : order.customers,
    inventory: Array.isArray(order.inventory) ? order.inventory[0] : order.inventory
  }))

  return NextResponse.json(mapped)
}
