'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type { UserSettingsRecord, UserSettingsUpdateParams } from '@/types'

const DEFAULT_SETTINGS: Omit<UserSettingsRecord, 'id' | 'user_id' | 'updated_at'> = {
  business_name: null,
  currency_symbol: '₡',
  cost_per_bag: 0,
  cost_per_sticker: 0,
  cost_electricity_per_order: 0,
  cost_fuel_per_order: 0,
  roaster_capacity_grams: 1200,
  green_input_per_roast_grams: 960,
  roasted_output_per_roast_grams: 760,
  labor_hourly_rate: 1600,
  roasts_per_hour: 3
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
        currency_symbol: params.currency_symbol || '₡',
        cost_per_bag: params.cost_per_bag ?? 0,
        cost_per_sticker: params.cost_per_sticker ?? 0,
        cost_electricity_per_order: params.cost_electricity_per_order ?? 0,
        cost_fuel_per_order: params.cost_fuel_per_order ?? 0,
        roaster_capacity_grams: params.roaster_capacity_grams ?? 1200,
        green_input_per_roast_grams: params.green_input_per_roast_grams ?? 960,
        roasted_output_per_roast_grams: params.roasted_output_per_roast_grams ?? 760,
        labor_hourly_rate: params.labor_hourly_rate ?? 1600,
        roasts_per_hour: params.roasts_per_hour ?? 3
      }])
      .select()
      .single()

    if (error) throw error
    result = data
  }

  revalidatePath('/', 'layout')
  return result as UserSettingsRecord
}
