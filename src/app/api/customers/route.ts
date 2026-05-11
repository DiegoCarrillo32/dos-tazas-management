import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .select('*, orders(order_date)')
    .order('full_name', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const mapped = (data || []).map(c => {
    const orders = Array.isArray(c.orders) ? c.orders : []
    const dates = orders.map((o: { order_date: string }) => o.order_date).filter(Boolean) as string[]
    dates.sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime())
    
    const rest = { ...c }
    delete rest.orders
    return {
      ...rest,
      last_purchase_date: dates.length > 0 ? dates[0] : null
    }
  })

  return NextResponse.json(mapped)
}
