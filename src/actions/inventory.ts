'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type { InventoryRecord, InventoryInsertParams, InventoryUpdateParams } from '@/types'

export async function fetchInventory(): Promise<InventoryRecord[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .order('item_name', { ascending: true })

  if (error) {
    console.error('Error fetching inventory:', error)
    return []
  }

  return (data || []) as InventoryRecord[]
}

export async function createInventoryItem(params: InventoryInsertParams): Promise<InventoryRecord> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('You must be logged in to create an inventory item.')
  }

  const { data, error } = await supabase
    .from('inventory')
    .insert([{
      ...params,
      user_id: user.id
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating inventory item:', error)
    throw new Error(error.message)
  }

  revalidatePath('/', 'layout')
  return data as InventoryRecord
}

export async function updateInventoryItem(id: string, params: InventoryUpdateParams): Promise<InventoryRecord> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory')
    .update(params)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating inventory item:', error)
    throw new Error(error.message)
  }

  revalidatePath('/', 'layout')
  return data as InventoryRecord
}

export async function deleteInventoryItem(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('inventory')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting inventory item:', error)
    throw new Error(error.message)
  }

  revalidatePath('/', 'layout')
}
