'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type { RoastingOrderRecord, RoastingOrderStatus } from '@/types'
import { defaultRoastingConfig } from '@/config/roastingConfig'
import { calculateQuote, type RoastingQuoteInput } from '@/utils/roasting-calculator'

export interface RoastingOrderInput extends RoastingQuoteInput {
  notes?: string | null
}

/**
 * Place a roasting-service order from a partner to the roaster that invited them.
 *
 * The cost is recomputed server-side from the shared roasting config so the
 * stored total is authoritative (the client preview is never trusted).
 */
export async function createRoastingOrder(input: RoastingOrderInput): Promise<RoastingOrderRecord> {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  // Resolve the active partnership owned by the current user.
  const { data: partner, error: partnerError } = await supabase
    .from('b2b_partners')
    .select('id, roaster_user_id, status')
    .eq('partner_user_id', userData.user.id)
    .eq('status', 'active')
    .limit(1)
    .single()

  if (partnerError || !partner) {
    throw new Error('No active roaster partnership found for your account.')
  }

  if (!input.quantityGrams || input.quantityGrams <= 0) {
    throw new Error('Enter a quantity greater than zero.')
  }

  // Authoritative recompute.
  const quote = calculateQuote(defaultRoastingConfig, {
    quantityGrams: input.quantityGrams,
    quantityBasis: input.quantityBasis,
    greenSource: input.greenSource,
    greenTierId: input.greenTierId,
    packaging: input.packaging,
    bagOptionId: input.bagOptionId,
    bagSizeId: input.bagSizeId,
    grinding: input.grinding,
    machinePreference: input.machinePreference,
  })

  const { data: newOrder, error: orderError } = await supabase
    .from('roasting_orders')
    .insert({
      partner_id: partner.id,
      roaster_user_id: partner.roaster_user_id,
      quantity_grams: input.quantityGrams,
      quantity_basis: input.quantityBasis,
      green_source: input.greenSource,
      green_tier_id: input.greenTierId ?? null,
      packaging: input.packaging,
      bag_option_id: input.bagOptionId ?? null,
      bag_size_id: input.bagSizeId ?? null,
      grinding: input.grinding,
      machine_id: quote.machine.id,
      green_grams_in: quote.greenGramsIn,
      roasted_grams_out: quote.roastedGramsOut,
      batches_needed: quote.batchesNeeded,
      hours_required: quote.hoursRequired,
      bags_needed: quote.bagsNeeded,
      cost_breakdown: quote.lineItems,
      total_cost: quote.totalCost,
      notes: input.notes ?? null,
      status: 'pending',
    })
    .select()
    .single()

  if (orderError) {
    throw new Error(`Failed to place roasting order: ${orderError.message}`)
  }

  revalidatePath('/roasting')
  return newOrder as RoastingOrderRecord
}

/**
 * Cancel a pending roasting order. RLS ensures the partner can only touch
 * their own; we additionally guard the status so accepted/completed orders
 * cannot be retroactively cancelled.
 */
export async function cancelRoastingOrder(id: string): Promise<RoastingOrderRecord> {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('roasting_orders')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('status', 'pending')
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to cancel roasting order: ${error.message}`)
  }

  revalidatePath('/roasting')
  return data as RoastingOrderRecord
}

const ROASTER_STATUS_TRANSITIONS: Record<RoastingOrderStatus, RoastingOrderStatus[]> = {
  pending: ['accepted', 'cancelled'],
  accepted: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

/**
 * Roaster updates the status of an incoming roasting order
 * (accept / complete / cancel). RLS limits this to the roaster's own orders;
 * we additionally enforce a valid state transition.
 */
export async function updateRoastingOrderStatus(
  id: string,
  status: RoastingOrderStatus
): Promise<RoastingOrderRecord> {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  const { data: current, error: currentError } = await supabase
    .from('roasting_orders')
    .select('status, roaster_user_id')
    .eq('id', id)
    .single()

  if (currentError || !current) {
    throw new Error('Roasting order not found.')
  }

  if (current.roaster_user_id !== userData.user.id) {
    throw new Error('You can only update roasting orders addressed to you.')
  }

  const allowed = ROASTER_STATUS_TRANSITIONS[current.status as RoastingOrderStatus] ?? []
  if (!allowed.includes(status)) {
    throw new Error(`Cannot change a ${current.status} order to ${status}.`)
  }

  const { data, error } = await supabase
    .from('roasting_orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update roasting order: ${error.message}`)
  }

  revalidatePath('/b2b')
  return data as RoastingOrderRecord
}
