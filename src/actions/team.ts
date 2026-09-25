'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { TeamMemberRecord, TeamMemberUpdateParams } from '@/types'
import { z } from 'zod'

// Fields a roaster may change on a team member (never worker_user_id).
const teamMemberUpdate = z.object({
  name: z.string().trim().max(100),
  hourly_rate: z.number().min(0),
  status: z.enum(['pending', 'active']),
}).partial()

/**
 * Generate a new invite code for a team member (worker).
 */
export async function generateTeamInvite(name: string, hourlyRate: number) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  // Generate a short invite code
  const inviteCode = crypto.randomUUID().slice(0, 8).toUpperCase()

  const { data, error } = await supabase
    .from('team_members')
    .insert({
      roaster_user_id: userData.user.id,
      name,
      invite_code: inviteCode,
      hourly_rate: hourlyRate,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to generate team invite: ${error.message}`)
  }

  revalidatePath('/team')
  return data as TeamMemberRecord
}

/**
 * Accept a team invite (worker signs up with code).
 */
export async function acceptTeamInvite(inviteCode: string) {
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
 * Get all team members for the current roaster.
 */
export async function getTeamMembers() {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('roaster_user_id', userData.user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch team members: ${error.message}`)
  }

  return data as TeamMemberRecord[]
}

/**
 * Get the roaster connection for the current worker.
 */
export async function getMyEmployer() {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('worker_user_id', userData.user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
        return null
    }
    throw new Error(`Failed to fetch employer connection: ${error.message}`)
  }

  return data as TeamMemberRecord
}

/**
 * Update a team member's details (e.g. hourly rate).
 */
export async function updateTeamMember(memberId: string, updates: TeamMemberUpdateParams) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  const parsed = teamMemberUpdate.safeParse(updates)
  if (!parsed.success) {
    throw new Error(`Invalid team member update: ${parsed.error.issues[0]?.message}`)
  }

  const { error } = await supabase
    .from('team_members')
    .update(parsed.data)
    .eq('id', memberId)
    .eq('roaster_user_id', userData.user.id) // Ensure ownership

  if (error) {
    throw new Error(`Failed to update team member: ${error.message}`)
  }

  revalidatePath('/team')
  return true
}

/**
 * Delete a team member.
 */
export async function deleteTeamMember(memberId: string) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', memberId)
    .eq('roaster_user_id', userData.user.id) // Ensure ownership

  if (error) {
    throw new Error(`Failed to delete team member: ${error.message}`)
  }

  revalidatePath('/team')
  return true
}

/**
 * Allows a worker to update their own name.
 */
export async function updateMyWorkerName(name: string) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase.rpc('update_my_worker_name', { p_name: name })

  if (error) {
    throw new Error(`Failed to update name: ${error.message}`)
  }

  revalidatePath('/settings')
  return true
}
