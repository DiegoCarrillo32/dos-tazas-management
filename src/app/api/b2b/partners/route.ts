import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', userData.user.id)
    .single()

  // Default to 'roaster' if no profile exists (for backward compatibility with accounts created before B2B feature)
  const role = profile?.role || 'roaster'

  if (role === 'roaster') {
    const { data: partners, error: partnersError } = await supabase
      .from('b2b_partners')
      .select('*')
      .eq('roaster_user_id', userData.user.id)
      .order('created_at', { ascending: false })

    if (partnersError) {
      return NextResponse.json({ error: partnersError.message }, { status: 500 })
    }

    return NextResponse.json(partners)
  } else if (role === 'partner') {
    const { data: roaster, error: roasterError } = await supabase
      .from('b2b_partners')
      .select('*')
      .eq('partner_user_id', userData.user.id)
      .single()

    if (roasterError) {
      return NextResponse.json({ error: roasterError.message }, { status: 500 })
    }

    return NextResponse.json(roaster)
  }

  return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
}
