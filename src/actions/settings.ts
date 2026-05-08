'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type { UserSettingsRecord, UserSettingsUpdateParams } from '@/types'

const DEFAULT_SETTINGS: Omit<UserSettingsRecord, 'id' | 'user_id' | 'updated_at'> = {
  business_name: null,
  roast_loss_percentage: 20,
  currency_symbol: '$'
}

export async function fetchSettings(): Promise<UserSettingsRecord> {
  const supabase = await createClient()

  // Get the current user's ID
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('You must be logged in to fetch settings.')
  }

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.error('Error fetching settings:', error)
    throw new Error(error.message)
  }

  if (!data) {
    // Return default settings if none exist yet
    return {
      ...DEFAULT_SETTINGS,
      id: 'default',
      user_id: user.id,
      updated_at: new Date().toISOString()
    }
  }

  return data as UserSettingsRecord
}

export async function updateSettings(params: UserSettingsUpdateParams) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('You must be logged in to update settings.')
  }

  // Check if settings exist
  const { data: existing } = await supabase
    .from('user_settings')
    .select('id')
    .eq('user_id', user.id)
    .single()

  let result

  if (existing) {
    const { data, error } = await supabase
      .from('user_settings')
      .update({
        ...params,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    result = data
  } else {
    const { data, error } = await supabase
      .from('user_settings')
      .insert([{
        user_id: user.id,
        business_name: params.business_name || null,
        roast_loss_percentage: params.roast_loss_percentage ?? 20,
        currency_symbol: params.currency_symbol || '$'
      }])
      .select()
      .single()

    if (error) throw error
    result = data
  }

  revalidatePath('/', 'layout')
  return result as UserSettingsRecord
}
