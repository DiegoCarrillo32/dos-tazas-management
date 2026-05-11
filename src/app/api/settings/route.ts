import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

const DEFAULT_SETTINGS = {
  business_name: null,
  roast_loss_percentage: 20,
  currency_symbol: '$'
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
