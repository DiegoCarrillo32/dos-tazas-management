import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find if user is partner or roaster
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', userData.user.id)
    .single()

  const role = profile?.role || 'roaster'

  let partnerIds: string[] = []

  if (role === 'partner') {
    // Get their partner record(s)
    const { data: partnerRecords } = await supabase
      .from('b2b_partners')
      .select('id')
      .eq('partner_user_id', userData.user.id)

    if (partnerRecords) {
      partnerIds = partnerRecords.map(p => p.id)
    }
  } else if (role === 'roaster') {
    // Get URL param for a specific partner, or return all their b2b orders?
    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get('partnerId')
    
    if (partnerId) {
      partnerIds = [partnerId]
    } else {
      // Roaster wants to see orders for all their partners
      const { data: roasterPartners } = await supabase
        .from('b2b_partners')
        .select('id')
        .eq('roaster_user_id', userData.user.id)
      
      if (roasterPartners) {
        partnerIds = roasterPartners.map(p => p.id)
      }
    }
  }

  if (partnerIds.length === 0) {
    return NextResponse.json([])
  }

  // Fetch orders with those partnerIds
  const { data, error } = await supabase
    .from('orders')
    .select('*, customers(full_name, phone), inventory(item_name)')
    .in('partner_id', partnerIds)
    .order('order_date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
