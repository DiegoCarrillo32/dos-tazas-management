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

  // Find partner invite if code is provided
  let linkedToId: string | null = null
  let partnerId: string | null = null

  if (inviteCode) {
    // Note: Due to RLS, if the schema restricts pending invite reads, this may require
    // a service role client or an RPC. Assuming schema allows it here as per instructions.
    const { data: partnerData, error: partnerError } = await supabase
      .from('b2b_partners')
      .select('id, roaster_user_id')
      .eq('invite_code', inviteCode)
      .eq('status', 'pending')
      .single()

    if (partnerError || !partnerData) {
      return { error: 'Invalid or expired invite code.' }
    }
    linkedToId = partnerData.roaster_user_id
    partnerId = partnerData.id
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

    if (inviteCode && linkedToId && partnerId) {
      // Create partner profile
      const { error: profileErr } = await dbClient.from('user_profiles').insert({
        user_id: user.id,
        role: 'partner',
        linked_to: linkedToId,
      })
      if (profileErr) console.error("Profile creation error:", profileErr)

      // Update partner row
      const { error: partnerErr } = await dbClient.from('b2b_partners').update({
        partner_user_id: user.id,
        status: 'active',
      }).eq('id', partnerId)
      if (partnerErr) console.error("Partner update error:", partnerErr)
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
