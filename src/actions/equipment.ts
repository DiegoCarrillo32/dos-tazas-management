'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type { EquipmentRecord, EquipmentInsertParams, EquipmentUpdateParams } from '@/types'

export async function createEquipment(params: EquipmentInsertParams): Promise<EquipmentRecord> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('You must be logged in to create equipment.')
  }

  const { data, error } = await supabase
    .from('equipment')
    .insert([{
      ...params,
      user_id: user.id
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating equipment:', error)
    throw new Error(error.message)
  }

  revalidatePath('/', 'layout')
  return data as EquipmentRecord
}

export async function updateEquipment(id: string, params: EquipmentUpdateParams): Promise<EquipmentRecord> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('equipment')
    .update(params)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating equipment:', error)
    throw new Error(error.message)
  }

  revalidatePath('/', 'layout')
  return data as EquipmentRecord
}

export async function deleteEquipment(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('equipment')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting equipment:', error)
    throw new Error(error.message)
  }

  revalidatePath('/', 'layout')
}
