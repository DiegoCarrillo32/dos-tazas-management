'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type { RoastBatchRecord, RoastBatchInsertParams, RoastBatchUpdateParams } from '@/types'

export async function createRoastBatch(params: RoastBatchInsertParams): Promise<RoastBatchRecord> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('You must be logged in to create a roast batch.')
  }

  // 1. Insert the roast batch
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

  // 2. We should ideally deduct the weight_in_grams from the green_coffee_lots inventory
  // Let's fetch the lot
  const { data: lotData } = await supabase
    .from('green_coffee_lots')
    .select('inventory_id')
    .eq('id', params.green_lot_id)
    .single()

  if (lotData?.inventory_id) {
    // get current stock
    const { data: invData } = await supabase
      .from('inventory')
      .select('stock_grams')
      .eq('id', lotData.inventory_id)
      .single()

    if (invData) {
      await supabase
        .from('inventory')
        .update({ stock_grams: Math.max(0, invData.stock_grams - params.weight_in_grams) })
        .eq('id', lotData.inventory_id)
    }
  }

  revalidatePath('/roasts')
  revalidatePath('/inventory')
  return data as RoastBatchRecord
}

export async function updateRoastBatch(id: string, params: RoastBatchUpdateParams): Promise<RoastBatchRecord> {
  const supabase = await createClient()

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

  revalidatePath('/roasts')
  return data as RoastBatchRecord
}

export async function deleteRoastBatch(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('roast_batches')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting roast batch:', error)
    throw new Error(error.message)
  }

  revalidatePath('/roasts')
}
