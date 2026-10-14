import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { isPartner, partnerOrders, toOrderWithJoins } from '@/utils/supabase/partnerOrders'

export async function GET() {
  const supabase = await createClient()

  if (await isPartner(supabase)) {
    const { data, error } = await partnerOrders(supabase)
      .or('fulfillment_status.neq.delivered,payment_status.neq.paid')
      .order('order_date', { ascending: false })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json((data || []).map(toOrderWithJoins))
  }

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
