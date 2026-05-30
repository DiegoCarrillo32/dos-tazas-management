'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type { MaintenanceLogRecord, MaintenanceLogInsertParams, MaintenanceLogUpdateParams } from '@/types'

export async function createMaintenanceLog(params: MaintenanceLogInsertParams): Promise<MaintenanceLogRecord> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('You must be logged in to log maintenance.')
  }

  const { data, error } = await supabase
    .from('maintenance_logs')
    .insert([{
      ...params,
      user_id: user.id
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating maintenance log:', error)
    throw new Error(error.message)
  }

  revalidatePath('/equipment')
  return data as MaintenanceLogRecord
}

export async function updateMaintenanceLog(id: string, params: MaintenanceLogUpdateParams): Promise<MaintenanceLogRecord> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('maintenance_logs')
    .update(params)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating maintenance log:', error)
    throw new Error(error.message)
  }

  revalidatePath('/equipment')
  return data as MaintenanceLogRecord
}

export async function deleteMaintenanceLog(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('maintenance_logs')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting maintenance log:', error)
    throw new Error(error.message)
  }

  revalidatePath('/equipment')
}
