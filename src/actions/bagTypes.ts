'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type { BagTypeRecord, BagTypeInsertParams, BagTypeUpdateParams } from '@/types'

export async function fetchBagTypes(): Promise<BagTypeRecord[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('bag_types')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching bag types:', error)
    return []
  }

  return (data || []) as BagTypeRecord[]
}

export async function createBagType(params: BagTypeInsertParams): Promise<BagTypeRecord> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('You must be logged in to create a bag type.')
  }

  const { data, error } = await supabase
    .from('bag_types')
    .insert([{
      ...params,
      user_id: user.id
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating bag type:', error)
    throw new Error(error.message)
  }

  revalidatePath('/', 'layout')
  return data as BagTypeRecord
}

export async function updateBagType(id: string, params: BagTypeUpdateParams): Promise<BagTypeRecord> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('bag_types')
    .update(params)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating bag type:', error)
    throw new Error(error.message)
  }

  revalidatePath('/', 'layout')
  return data as BagTypeRecord
}

export async function deleteBagType(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('bag_types')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting bag type:', error)
    throw new Error(error.message)
  }

  revalidatePath('/', 'layout')
}
