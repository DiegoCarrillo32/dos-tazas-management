import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  // We want to join with equipment and green_coffee_lots to get names
  const { data, error } = await supabase
    .from('roast_batches')
    .select(`
      *,
      equipment:equipment_id(name),
      green_coffee_lots:green_lot_id(name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Flatten the relationships for easier consumption
  const formattedData = (data || []).map(batch => ({
    ...batch,
    equipment_name: batch.equipment?.name,
    green_lot_name: batch.green_coffee_lots?.name
  }))

  return NextResponse.json(formattedData)
}
