'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { TeamMemberRecord, TeamMemberUpdateParams } from '@/types'

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

  const { data: teamData, error: teamError } = await supabase
    .from('team_members')
    .select('id, status, roaster_user_id')
    .eq('invite_code', inviteCode)
    .single()

  if (teamError || !teamData) {
    throw new Error('Invalid invite code.')
  }

  if (teamData.status !== 'pending') {
    throw new Error('Invite code has already been used or revoked.')
  }

  // Update team_members
  const { error: updateError } = await supabase
    .from('team_members')
    .update({
      worker_user_id: userData.user.id,
      status: 'active',
    })
    .eq('id', teamData.id)

  if (updateError) {
    throw new Error(`Failed to accept invite: ${updateError.message}`)
  }

  // Update user profile
  const { error: profileError } = await supabase
    .from('user_profiles')
    .upsert({
      user_id: userData.user.id,
      role: 'worker',
      linked_to: teamData.roaster_user_id,
    }, { onConflict: 'user_id' })

  if (profileError) {
    throw new Error(`Failed to update profile: ${profileError.message}`)
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

  const { error } = await supabase
    .from('team_members')
    .update(updates)
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

  const { error } = await supabase
    .from('team_members')
    .update({ name })
    .eq('worker_user_id', userData.user.id)

  if (error) {
    throw new Error(`Failed to update name: ${error.message}`)
  }

  revalidatePath('/settings')
  return true
}
