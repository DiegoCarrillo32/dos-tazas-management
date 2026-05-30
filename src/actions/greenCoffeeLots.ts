'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type { GreenCoffeeLotRecord, GreenCoffeeLotInsertParams, GreenCoffeeLotUpdateParams } from '@/types'

export async function createGreenCoffeeLot(params: GreenCoffeeLotInsertParams): Promise<GreenCoffeeLotRecord> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('You must be logged in to create a lot.')
  }

  const { data, error } = await supabase
    .from('green_coffee_lots')
    .insert([{
      ...params,
      user_id: user.id
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating green coffee lot:', error)
    throw new Error(error.message)
  }

  revalidatePath('/inventory')
  return data as GreenCoffeeLotRecord
}

export async function updateGreenCoffeeLot(id: string, params: GreenCoffeeLotUpdateParams): Promise<GreenCoffeeLotRecord> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('green_coffee_lots')
    .update(params)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating green coffee lot:', error)
    throw new Error(error.message)
  }

  revalidatePath('/inventory')
  return data as GreenCoffeeLotRecord
}

export async function deleteGreenCoffeeLot(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('green_coffee_lots')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting green coffee lot:', error)
    throw new Error(error.message)
  }

  revalidatePath('/inventory')
}
