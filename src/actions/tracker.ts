'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { TimeLogRecord } from '@/types'

/**
 * Log time as a worker. Snapshots the worker's current hourly rate so
 * historical pay is not affected by future rate changes.
 */
export async function logTime(startTime: string, endTime: string, notes: string | null) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  const { data: teamData, error: teamError } = await supabase
    .from('team_members')
    .select('id, roaster_user_id, hourly_rate')
    .eq('worker_user_id', userData.user.id)
    .single()

  if (teamError || !teamData) {
    throw new Error('Not assigned to a team')
  }

  // Overlap check: reject if any existing log for this worker overlaps
  const { data: overlapping } = await supabase
    .from('time_logs')
    .select('id')
    .eq('worker_id', teamData.id)
    .lt('start_time', endTime)
    .gt('end_time', startTime)
    .limit(1)

  if (overlapping && overlapping.length > 0) {
    throw new Error('OVERLAP: This shift overlaps with an existing time log.')
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
      rate_snapshot: teamData.hourly_rate,
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
 * Joins team_members to provide hourly_rate fallback for pre-migration logs
 * that don't have a rate_snapshot.
 */
export async function getWorkerTimeLogs() {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

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
    .select('*, team_members(hourly_rate)')
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
    .eq('roaster_user_id', userData.user.id)

  if (error) {
    throw new Error(`Failed to mark logs as paid: ${error.message}`)
  }

  revalidatePath('/team')
  return true
}

/**
 * Update a time log's adjusted hours and optional adjustment note (admin only).
 * Passing null for adjustedHours clears both the override and the note.
 */
export async function updateTimeLogHours(
  logId: string,
  adjustedHours: number | null,
  adjustmentNote: string | null
) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('time_logs')
    .update({
      adjusted_hours: adjustedHours,
      adjustment_note: adjustedHours === null ? null : adjustmentNote,
    })
    .eq('id', logId)
    .eq('roaster_user_id', userData.user.id)

  if (error) {
    throw new Error(`Failed to update time log: ${error.message}`)
  }

  revalidatePath('/team')
  return true
}

/**
 * Update a worker's own pending time log (date/start/end/notes).
 * Only applies to pending logs — paid logs are immutable.
 */
export async function updateWorkerTimeLog(
  logId: string,
  params: { start_time: string; end_time: string; notes: string | null }
) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  const { data: teamData } = await supabase
    .from('team_members')
    .select('id')
    .eq('worker_user_id', userData.user.id)
    .single()

  if (!teamData) {
    throw new Error('Not assigned to a team')
  }

  // Overlap check: reject if any other log for this worker overlaps the new range
  const { data: overlapping } = await supabase
    .from('time_logs')
    .select('id')
    .eq('worker_id', teamData.id)
    .neq('id', logId)
    .lt('start_time', params.end_time)
    .gt('end_time', params.start_time)
    .limit(1)

  if (overlapping && overlapping.length > 0) {
    throw new Error('OVERLAP: This shift overlaps with an existing time log.')
  }

  const { error } = await supabase
    .from('time_logs')
    .update({
      start_time: params.start_time,
      end_time: params.end_time,
      notes: params.notes,
    })
    .eq('id', logId)
    .eq('worker_id', teamData.id)
    .eq('status', 'pending')

  if (error) {
    throw new Error(`Failed to update time log: ${error.message}`)
  }

  revalidatePath('/tracker')
  return true
}

/**
 * Revert a paid time log back to pending (admin only).
 */
export async function revertTimeLogToPending(logId: string) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('time_logs')
    .update({ status: 'pending' })
    .eq('id', logId)
    .eq('roaster_user_id', userData.user.id)

  if (error) {
    throw new Error(`Failed to revert log: ${error.message}`)
  }

  revalidatePath('/team')
  return true
}

/**
 * Admin creates a time log on behalf of a specific worker.
 * Snapshots the worker's current hourly rate.
 */
export async function addTimeLogForWorker(
  workerId: string,
  startTime: string,
  endTime: string,
  notes: string | null
) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  const { data: memberData, error: memberError } = await supabase
    .from('team_members')
    .select('id, roaster_user_id, hourly_rate')
    .eq('id', workerId)
    .eq('roaster_user_id', userData.user.id)
    .single()

  if (memberError || !memberData) {
    throw new Error('Worker not found or access denied')
  }

  const { error } = await supabase
    .from('time_logs')
    .insert({
      worker_id: memberData.id,
      roaster_user_id: memberData.roaster_user_id,
      start_time: startTime,
      end_time: endTime,
      notes: notes,
      status: 'pending',
      rate_snapshot: memberData.hourly_rate,
    })

  if (error) {
    throw new Error(`Failed to add time log: ${error.message}`)
  }

  revalidatePath('/team')
  return true
}

/**
 * Delete a time log (worker or admin).
 * RLS policies handle authorization.
 */
export async function deleteTimeLog(logId: string) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

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
