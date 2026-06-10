import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Scope to the current user's own inventory. The inventory table has a
  // permissive RLS policy that also lets partners SELECT their roaster's
  // inventory (needed for B2B pricing joins), so we filter explicitly here to
  // keep the Inventory page showing only the signed-in user's own stock.
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', user.id)
    .order('item_name', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}
