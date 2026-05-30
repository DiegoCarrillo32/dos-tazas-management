'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { B2BPricingRecord } from '@/types'

/**
 * Get custom pricing for a specific partner.
 */
export async function getPartnerPricing(partnerId: string) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('b2b_pricing')
    .select('*, inventory(item_name)')
    .eq('partner_id', partnerId)

  if (error) {
    throw new Error(`Failed to fetch pricing: ${error.message}`)
  }

  return data
}

/**
 * Set custom pricing for a specific partner and inventory item.
 */
export async function setPartnerPricing(
  partnerId: string,
  inventoryId: string,
  pricePerKg: number
) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('b2b_pricing')
    .upsert(
      {
        partner_id: partnerId,
        inventory_id: inventoryId,
        price_per_kg: pricePerKg,
      },
      { onConflict: 'partner_id, inventory_id' }
    )
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to set pricing: ${error.message}`)
  }

  revalidatePath(`/dashboard/partners/${partnerId}`)
  return data as B2BPricingRecord
}

/**
 * Delete custom pricing for a specific partner and inventory item.
 */
export async function deletePartnerPricing(pricingId: string, partnerId: string) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('b2b_pricing')
    .delete()
    .eq('id', pricingId)

  if (error) {
    throw new Error(`Failed to delete pricing: ${error.message}`)
  }

  revalidatePath(`/dashboard/partners/${partnerId}`)
  return true
}
