'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createClient as createJSClient } from '@supabase/supabase-js'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const inviteCode = formData.get('inviteCode') as string | null

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()

  // Find partner or worker invite if code is provided
  let linkedToId: string | null = null
  let recordId: string | null = null
  let roleToAssign: 'partner' | 'worker' | null = null

  if (inviteCode) {
    // Check B2B partners first
    const { data: partnerData } = await supabase
      .from('b2b_partners')
      .select('id, roaster_user_id')
      .eq('invite_code', inviteCode)
      .eq('status', 'pending')
      .single()

    if (partnerData) {
      linkedToId = partnerData.roaster_user_id
      recordId = partnerData.id
      roleToAssign = 'partner'
    } else {
      // Check team members if not a partner
      const { data: teamData } = await supabase
        .from('team_members')
        .select('id, roaster_user_id')
        .eq('invite_code', inviteCode)
        .eq('status', 'pending')
        .single()
        
      if (teamData) {
        linkedToId = teamData.roaster_user_id
        recordId = teamData.id
        roleToAssign = 'worker'
      } else {
        return { error: 'Invalid or expired invite code.' }
      }
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  const user = data.user
  if (user) {
    // Because Next.js cookies() doesn't immediately reflect new cookies in the same request,
    // we must manually pass the new session's access token to authenticate the inserts.
    let dbClient = supabase
    if (data.session) {
      dbClient = createJSClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
      )
      await dbClient.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      })
    }

    if (inviteCode && linkedToId && recordId && roleToAssign) {
      // Create user profile
      const { error: profileErr } = await dbClient.from('user_profiles').insert({
        user_id: user.id,
        role: roleToAssign,
        linked_to: linkedToId,
      })
      if (profileErr) console.error("Profile creation error:", profileErr)

      if (roleToAssign === 'partner') {
        // Update partner row
        const { error: partnerErr } = await dbClient.from('b2b_partners').update({
          partner_user_id: user.id,
          status: 'active',
        }).eq('id', recordId)
        if (partnerErr) console.error("Partner update error:", partnerErr)
      } else if (roleToAssign === 'worker') {
        // Update team member row
        const { error: teamErr } = await dbClient.from('team_members').update({
          worker_user_id: user.id,
          status: 'active',
        }).eq('id', recordId)
        if (teamErr) console.error("Team member update error:", teamErr)
      }
    } else {
      // Create roaster profile
      const { error: profileErr } = await dbClient.from('user_profiles').insert({
        user_id: user.id,
        role: 'roaster',
      })
      if (profileErr) console.error("Profile creation error:", profileErr)
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Logout error:', error.message)
    // In a form action, we might just want to redirect anyway or throw
  }

  revalidatePath('/', 'layout')
  redirect('/login')
}
