import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resolvedParams = await params
  const { partnerId } = resolvedParams

  const { data, error } = await supabase
    .from('b2b_pricing')
    .select('*, inventory(item_name)')
    .eq('partner_id', partnerId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
