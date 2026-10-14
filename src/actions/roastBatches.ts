'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type { RoastBatchRecord, RoastBatchInsertParams, RoastBatchUpdateParams } from '@/types'

type Supabase = Awaited<ReturnType<typeof createClient>>

// Atomically moves green stock for the inventory item behind a lot.
async function adjustLotStock(supabase: Supabase, lotId: string, deltaGrams: number) {
  if (!deltaGrams) return
  const { data: lot, error: lotError } = await supabase
    .from('green_coffee_lots')
    .select('inventory_id')
    .eq('id', lotId)
    .single()
  if (lotError || !lot) throw new Error(lotError?.message || 'Lot not found')

  const { error } = await supabase.rpc('adjust_stock', {
    p_inventory_id: lot.inventory_id,
    p_delta: deltaGrams,
  })
  if (error) throw new Error(`Failed to update stock: ${error.message}`)
}

export async function createRoastBatch(params: RoastBatchInsertParams): Promise<RoastBatchRecord> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('You must be logged in to create a roast batch.')
  }

  const { data, error } = await supabase
    .from('roast_batches')
    .insert([{
      ...params,
      user_id: user.id
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating roast batch:', error)
    throw new Error(error.message)
  }

  // Roasting consumes the green coffee going in.
  try {
    await adjustLotStock(supabase, params.green_lot_id, -params.weight_in_grams)
  } catch (err) {
    await supabase.from('roast_batches').delete().eq('id', data.id)
    throw err
  }

  revalidatePath('/roasts')
  revalidatePath('/inventory')
  return data as RoastBatchRecord
}

export async function updateRoastBatch(id: string, params: RoastBatchUpdateParams): Promise<RoastBatchRecord> {
  const supabase = await createClient()

  const { data: old, error: oldError } = await supabase
    .from('roast_batches')
    .select('green_lot_id, weight_in_grams')
    .eq('id', id)
    .single()

  if (oldError || !old) {
    throw new Error(oldError?.message || 'Roast batch not found')
  }

  const { data, error } = await supabase
    .from('roast_batches')
    .update(params)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating roast batch:', error)
    throw new Error(error.message)
  }

  // Move stock to match the edited lot/weight.
  if (data.green_lot_id !== old.green_lot_id) {
    await adjustLotStock(supabase, old.green_lot_id, old.weight_in_grams)
    await adjustLotStock(supabase, data.green_lot_id, -data.weight_in_grams)
  } else {
    await adjustLotStock(supabase, data.green_lot_id, old.weight_in_grams - data.weight_in_grams)
  }

  revalidatePath('/roasts')
  revalidatePath('/inventory')
  return data as RoastBatchRecord
}

export async function deleteRoastBatch(id: string): Promise<void> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('roast_batches')
    .delete()
    .eq('id', id)
    .select('green_lot_id, weight_in_grams')
    .single()

  if (error) {
    console.error('Error deleting roast batch:', error)
    throw new Error(error.message)
  }

  // Return the green coffee the batch had consumed.
  await adjustLotStock(supabase, data.green_lot_id, data.weight_in_grams)

  revalidatePath('/roasts')
  revalidatePath('/inventory')
}
