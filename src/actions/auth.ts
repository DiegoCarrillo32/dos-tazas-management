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

  if (inviteCode) {
    const { data: invite } = await supabase.rpc('get_invite', { p_code: inviteCode }).maybeSingle()
    if (!invite) {
      return { error: 'Invalid or expired invite code.' }
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

    if (inviteCode) {
      const { error: claimErr } = await dbClient.rpc('claim_invite', { p_code: inviteCode })
      if (claimErr) console.error("Invite claim error:", claimErr)
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
