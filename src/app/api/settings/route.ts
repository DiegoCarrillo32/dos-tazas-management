import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

const DEFAULT_SETTINGS = {
  business_name: null,
  currency_symbol: '₡',
  cost_per_bag: 0,
  cost_per_sticker: 0,
  cost_electricity_per_order: 0,
  cost_fuel_per_order: 0,
  roaster_capacity_grams: 1200,
  green_input_per_roast_grams: 960,
  roasted_output_per_roast_grams: 760,
  labor_hourly_rate: 1600,
  roasts_per_hour: 3
}

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({
      ...DEFAULT_SETTINGS,
      id: 'default',
      user_id: user.id,
      updated_at: new Date().toISOString()
    })
  }

  return NextResponse.json(data)
}
