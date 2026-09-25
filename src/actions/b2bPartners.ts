'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { B2BPartnerRecord } from '@/types'

/**
 * Generate a new invite code for a B2B partner.
 */
export async function generateInvite(
  companyName: string,
  contactName: string | null,
  contactPhone: string | null,
  inviteEmail: string | null
) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  // `required` on the input still accepts whitespace, so trim server-side.
  const company = companyName?.trim() || ''
  if (!company) {
    throw new Error('Company name is required.')
  }

  // Generate a short invite code
  const inviteCode = crypto.randomUUID().slice(0, 8).toUpperCase()

  const { data, error } = await supabase
    .from('b2b_partners')
    .insert({
      roaster_user_id: userData.user.id,
      invite_code: inviteCode,
      company_name: company,
      contact_name: contactName?.trim() || null,
      contact_phone: contactPhone?.trim() || null,
      invite_email: inviteEmail?.trim() || null,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to generate invite: ${error.message}`)
  }

  revalidatePath('/b2b')
  return data as B2BPartnerRecord
}

/**
 * Accept an invite (called when a partner signs up with a code, or applies it later).
 * Also see auth.ts for signup integration.
 */
export async function acceptInvite(inviteCode: string) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase.rpc('claim_invite', { p_code: inviteCode })
  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/')
  return true
}

/**
 * Revoke a partner's access.
 */
export async function revokePartner(partnerId: string) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('b2b_partners')
    .update({ status: 'revoked' })
    .eq('id', partnerId)
    .eq('roaster_user_id', userData.user.id) // Ensure ownership

  if (error) {
    throw new Error(`Failed to revoke partner: ${error.message}`)
  }

  revalidatePath('/b2b')
  return true
}

/**
 * Restore a revoked partner's access.
 */
export async function restorePartner(partnerId: string) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('b2b_partners')
    .update({ status: 'active' })
    .eq('id', partnerId)
    .eq('roaster_user_id', userData.user.id) // Ensure ownership
    .eq('status', 'revoked') // Never activate an unclaimed invite

  if (error) {
    throw new Error(`Failed to restore partner: ${error.message}`)
  }

  revalidatePath('/b2b')
  return true
}

/**
 * Permanently delete a partner and all associated data (pricing, recurring orders).
 */
export async function deletePartner(partnerId: string) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('b2b_partners')
    .delete()
    .eq('id', partnerId)
    .eq('roaster_user_id', userData.user.id) // Ensure ownership

  if (error) {
    throw new Error(`Failed to delete partner: ${error.message}`)
  }

  revalidatePath('/b2b')
  return true
}

/**
 * Get all partners for the current roaster.
 */
export async function getMyPartners() {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('b2b_partners')
    .select('*')
    .eq('roaster_user_id', userData.user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch partners: ${error.message}`)
  }

  return data as B2BPartnerRecord[]
}

/**
 * Get the roaster connection for the current partner.
 */
export async function getMyRoaster() {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('b2b_partners')
    .select('*')
    .eq('partner_user_id', userData.user.id)
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch roaster connection: ${error.message}`)
  }

  return data as B2BPartnerRecord | null
}
