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
      quantity_shipped_kg: params.quantity_shipped_kg ?? 0,
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

export async function shipGreenCoffeeLot(id: string, kgToShip: number): Promise<GreenCoffeeLotRecord> {
  const supabase = await createClient()

  // Read current shipped amount then increment — avoids a race on concurrent updates
  const { data: current, error: readError } = await supabase
    .from('green_coffee_lots')
    .select('quantity_shipped_kg, quantity_kg')
    .eq('id', id)
    .single()

  if (readError || !current) {
    throw new Error(readError?.message || 'Lot not found')
  }

  const newShipped = (current.quantity_shipped_kg || 0) + kgToShip
  if (current.quantity_kg !== null && newShipped > current.quantity_kg) {
    throw new Error(`Cannot ship ${kgToShip} kg — only ${(current.quantity_kg - (current.quantity_shipped_kg || 0)).toFixed(2)} kg available`)
  }

  const { data, error } = await supabase
    .from('green_coffee_lots')
    .update({ quantity_shipped_kg: newShipped })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error shipping lot:', error)
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
