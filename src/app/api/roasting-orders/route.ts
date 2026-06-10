import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // RLS returns rows for either the partner (own partnership) or the roaster.
  // The b2b_partners join supplies the company name for the roaster's view; both
  // roles can read the related partner row under their respective policies.
  const { data, error } = await supabase
    .from('roasting_orders')
    .select('*, b2b_partners(company_name)')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const mapped = (data || []).map(order => ({
    ...order,
    b2b_partners: Array.isArray(order.b2b_partners) ? order.b2b_partners[0] : order.b2b_partners,
  }))

  return NextResponse.json(mapped)
}
