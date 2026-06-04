'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { TimeLogRecord } from '@/types'

/**
 * Log time as a worker.
 */
export async function logTime(startTime: string, endTime: string, notes: string | null) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  // Get the worker's team member record to find the roaster_user_id
  const { data: teamData, error: teamError } = await supabase
    .from('team_members')
    .select('id, roaster_user_id')
    .eq('worker_user_id', userData.user.id)
    .single()

  if (teamError || !teamData) {
    throw new Error('Not assigned to a team')
  }

  const { data, error } = await supabase
    .from('time_logs')
    .insert({
      worker_id: teamData.id,
      roaster_user_id: teamData.roaster_user_id,
      start_time: startTime,
      end_time: endTime,
      notes: notes,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to log time: ${error.message}`)
  }

  revalidatePath('/tracker')
  return data as TimeLogRecord
}

/**
 * Get time logs for a worker (to view their own history).
 */
export async function getWorkerTimeLogs() {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  // Find the worker's team member id
  const { data: teamData } = await supabase
    .from('team_members')
    .select('id')
    .eq('worker_user_id', userData.user.id)
    .single()

  if (!teamData) {
    return []
  }

  const { data, error } = await supabase
    .from('time_logs')
    .select('*')
    .eq('worker_id', teamData.id)
    .order('start_time', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch time logs: ${error.message}`)
  }

  return data as TimeLogRecord[]
}

/**
 * Get all time logs for a roaster (admin) to review.
 */
export async function getTeamTimeLogs() {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('time_logs')
    .select(`
      *,
      team_members (
        name,
        invite_code,
        hourly_rate,
        worker_user_id
      )
    `)
    .eq('roaster_user_id', userData.user.id)
    .order('start_time', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch time logs: ${error.message}`)
  }

  return data as TimeLogRecord[]
}

/**
 * Mark a list of time logs as paid (admin only).
 */
export async function markTimeLogsPaid(logIds: string[]) {
  if (!logIds.length) return true

  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('time_logs')
    .update({ status: 'paid' })
    .in('id', logIds)
    .eq('roaster_user_id', userData.user.id) // Ensure ownership

  if (error) {
    throw new Error(`Failed to mark logs as paid: ${error.message}`)
  }

  revalidatePath('/team')
  return true
}

/**
 * Delete a time log (worker or admin).
 * Assuming RLS allows workers to delete their own, or admin to delete any they own.
 */
export async function deleteTimeLog(logId: string) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  // The RLS policies handle verifying if the user can delete it
  const { error } = await supabase
    .from('time_logs')
    .delete()
    .eq('id', logId)

  if (error) {
    throw new Error(`Failed to delete time log: ${error.message}`)
  }

  revalidatePath('/tracker')
  revalidatePath('/team')
  return true
}
