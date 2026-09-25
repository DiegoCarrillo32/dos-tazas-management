'use server'

import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { authActionClient } from '@/lib/safe-action'
import { orderSchema } from '@/lib/schemas'
import { B2B_AUTO_CUSTOMER_ID, findOrCreateB2BCustomer } from '@/utils/b2bCustomer'
import { calculateOrderCosts, calculateRawGrams, roastLossPercentage } from '@/utils/calculations'
import { fetchSettings } from './settings'
import * as z from 'zod'

/**
 * Atomically add `delta` grams to an inventory item (negative to deduct).
 * Returns the new stock level; throws if the update fails.
 */
async function adjustStock(supabase: SupabaseClient, inventoryId: string, delta: number): Promise<number> {
  const { data, error } = await supabase.rpc('adjust_stock', {
    p_inventory_id: inventoryId,
    p_delta: Math.round(delta),
  })
  if (error) throw new Error(`Failed to update inventory: ${error.message}`)
  return data as number
}

/**
 * The B2B form submits a sentinel instead of a customer id: resolve it from
 * the linked partner, or from the typed company name when the order is a
 * manual (unlinked) B2B entry.
 */
async function resolveB2BCustomer(
  supabase: SupabaseClient,
  userId: string,
  { company_name, partner_id }: { company_name?: string | null; partner_id?: string | null }
): Promise<string> {
  let companyName = company_name?.trim() || ''
  let contactPhone: string | null = null

  if (partner_id) {
    const { data: partner, error: partnerError } = await supabase
      .from('b2b_partners')
      .select('company_name, contact_phone')
      .eq('id', partner_id)
      .single()

    if (partnerError || !partner) {
      throw new Error('The selected partner could not be found.')
    }

    companyName = partner.company_name
    contactPhone = partner.contact_phone
  }

  if (!companyName) {
    throw new Error(
      'Could not resolve a customer for this B2B order — select a partner or enter a company name.'
    )
  }

  return findOrCreateB2BCustomer(supabase, { userId, companyName, phone: contactPhone })
}

const orderId = z.string().uuid()

export const createOrder = authActionClient
  .schema(orderSchema)
  .action(async ({ parsedInput: params, ctx: { user, supabase } }) => {

  const customerId = params.customer_id === B2B_AUTO_CUSTOMER_ID
    ? await resolveB2BCustomer(supabase, user.id, params)
    : params.customer_id

  const settings = await fetchSettings()
  const bagCount = params.bag_count ?? 1

  let costPerKg: number | null = null
  let rawGramsUsed: number | null = null

  if (params.inventory_id && params.amount_grams) {
    const { data: invItem } = await supabase
      .from('inventory')
      .select('cost_per_kg')
      .eq('id', params.inventory_id)
      .single()

    if (invItem) {
      costPerKg = invItem.cost_per_kg ? Number(invItem.cost_per_kg) : null
      rawGramsUsed = Math.round(calculateRawGrams(params.amount_grams, roastLossPercentage(settings)))
    }
  }

  let bagUnitCost: number | null = null
  if (params.bag_type_id) {
    const { data: bagType } = await supabase
      .from('bag_types')
      .select('cost')
      .eq('id', params.bag_type_id)
      .single()
    if (bagType) bagUnitCost = Number(bagType.cost)
  }

  const { costBreakdown, totalCost } = calculateOrderCosts({
    amountGrams: params.amount_grams ?? 0,
    bagCount,
    settings,
    costPerKg,
    bagUnitCost
  })

  const { data, error } = await supabase
    .from('orders')
    .insert([{
      ...params,
      customer_id: customerId,
      bag_count: bagCount,
      user_id: user.id,
      fulfillment_status: 'pending',
      payment_status: 'pending',
      total_cost: totalCost,
      cost_breakdown: costBreakdown,
      raw_grams_used: rawGramsUsed,
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating order:', error)
    throw new Error(error.message)
  }

  // Deduct stock only once the order exists; undo the order if that fails.
  let stockAfter: number | null = null
  if (params.inventory_id && rawGramsUsed) {
    try {
      stockAfter = await adjustStock(supabase, params.inventory_id, -rawGramsUsed)
    } catch (err) {
      await supabase.from('orders').delete().eq('id', data.id)
      throw err
    }
  }

  revalidatePath('/', 'layout')
  return { ...data, stock_went_negative: stockAfter !== null && stockAfter < 0 }
})

export const updateFulfillmentStatus = authActionClient
  .schema(z.object({ id: orderId, status: z.enum(['pending', 'roasted', 'delivered']) }))
  .action(async ({ parsedInput: { id: orderId, status }, ctx: { supabase } }) => {

  const { data, error } = await supabase
    .from('orders')
    .update({ fulfillment_status: status })
    .eq('id', orderId)
    .select()
    .single()

  if (error) {
    console.error('Error updating fulfillment status:', error)
    throw new Error(error.message)
  }

  revalidatePath('/', 'layout')
  return data
})

export const updatePaymentStatus = authActionClient
  .schema(z.object({ id: orderId, status: z.enum(['pending', 'paid']) }))
  .action(async ({ parsedInput: { id: orderId, status }, ctx: { supabase } }) => {

  const { data, error } = await supabase
    .from('orders')
    .update({ payment_status: status })
    .eq('id', orderId)
    .select()
    .single()

  if (error) {
    console.error('Error updating payment status:', error)
    throw new Error(error.message)
  }

  revalidatePath('/', 'layout')
  return data
})

export const updateOrder = authActionClient
  .schema(z.object({ id: orderId, params: orderSchema.partial() }))
  .action(async ({ parsedInput: { id: orderId, params }, ctx: { user, supabase } }) => {

  // 1. Fetch original order details to reconcile inventory
  const { data: oldOrder, error: fetchError } = await supabase
    .from('orders')
    .select('inventory_id, amount_grams, bag_count, bag_type_id, raw_grams_used')
    .eq('id', orderId)
    .single()

  if (fetchError) {
    console.error('Error fetching old order details:', fetchError)
    throw new Error('Failed to retrieve original order details for inventory reconciliation.')
  }

  if (params.customer_id === B2B_AUTO_CUSTOMER_ID) {
    params.customer_id = await resolveB2BCustomer(supabase, user.id, params)
  }

  const settings = await fetchSettings()
  const lossPercentage = roastLossPercentage(settings)

  const finalInventoryId = params.inventory_id !== undefined ? params.inventory_id : oldOrder.inventory_id
  const finalAmountGrams = params.amount_grams !== undefined ? params.amount_grams : oldOrder.amount_grams

  // 2. Reconcile inventory: give back what this order actually consumed (older
  // rows predate raw_grams_used, so fall back to recomputing), then take the
  // new amount.
  const inventoryChanged = params.inventory_id !== undefined || params.amount_grams !== undefined
  const oldRawGrams = oldOrder.inventory_id && oldOrder.amount_grams
    ? (oldOrder.raw_grams_used ?? Math.round(calculateRawGrams(oldOrder.amount_grams, lossPercentage)))
    : 0
  let newRawGrams = oldOrder.raw_grams_used ?? null

  if (inventoryChanged) {
    newRawGrams = finalInventoryId && finalAmountGrams
      ? Math.round(calculateRawGrams(finalAmountGrams, lossPercentage))
      : null

    if (finalInventoryId === oldOrder.inventory_id) {
      const diff = (newRawGrams ?? 0) - oldRawGrams
      if (finalInventoryId && diff !== 0) await adjustStock(supabase, finalInventoryId, -diff)
    } else {
      if (oldOrder.inventory_id && oldRawGrams) await adjustStock(supabase, oldOrder.inventory_id, oldRawGrams)
      if (finalInventoryId && newRawGrams) await adjustStock(supabase, finalInventoryId, -newRawGrams)
    }
  }

  // 3. Recompute cost breakdown if cost-relevant fields changed
  const costRelevantChange = inventoryChanged ||
    params.bag_count !== undefined ||
    params.bag_type_id !== undefined

  let costUpdate: Record<string, unknown> = {}

  if (costRelevantChange) {
    const finalBagCount = params.bag_count !== undefined ? params.bag_count : (oldOrder.bag_count ?? 1)
    const finalBagTypeId = params.bag_type_id !== undefined ? params.bag_type_id : oldOrder.bag_type_id

    let costPerKg: number | null = null
    if (finalInventoryId && finalAmountGrams) {
      const { data: invItem } = await supabase
        .from('inventory')
        .select('cost_per_kg')
        .eq('id', finalInventoryId)
        .single()

      if (invItem) {
        costPerKg = invItem.cost_per_kg ? Number(invItem.cost_per_kg) : null
      }
    }

    let bagUnitCost: number | null = null
    if (finalBagTypeId) {
      const { data: bagType } = await supabase
        .from('bag_types')
        .select('cost')
        .eq('id', finalBagTypeId)
        .single()
      if (bagType) bagUnitCost = Number(bagType.cost)
    }

    const { costBreakdown, totalCost } = calculateOrderCosts({
      amountGrams: finalAmountGrams ?? 0,
      bagCount: finalBagCount ?? 1,
      settings,
      costPerKg,
      bagUnitCost
    })

    costUpdate = { total_cost: totalCost, cost_breakdown: costBreakdown, raw_grams_used: newRawGrams }
  }

  // 4. Perform database update
  const { data, error } = await supabase
    .from('orders')
    .update({ ...params, ...costUpdate })
    .eq('id', orderId)
    .select()
    .single()

  if (error) {
    console.error('Error updating order:', error)
    throw new Error(error.message)
  }

  revalidatePath('/', 'layout')
  return data
})

export const deleteOrder = authActionClient
  .schema(z.object({ id: orderId }))
  .action(async ({ parsedInput: { id: orderId }, ctx: { supabase } }) => {

  const { data: oldOrder, error: fetchError } = await supabase
    .from('orders')
    .select('inventory_id, amount_grams, raw_grams_used')
    .eq('id', orderId)
    .single()

  if (fetchError) {
    console.error('Error fetching old order details:', fetchError)
    throw new Error('Failed to retrieve order details for deletion.')
  }

  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId)

  if (error) {
    console.error('Error deleting order:', error)
    throw new Error(error.message)
  }

  // Give back the coffee this order consumed.
  if (oldOrder.inventory_id && oldOrder.amount_grams) {
    const rawGrams = oldOrder.raw_grams_used ??
      Math.round(calculateRawGrams(oldOrder.amount_grams, roastLossPercentage(await fetchSettings())))
    await adjustStock(supabase, oldOrder.inventory_id, rawGrams)
  }

  revalidatePath('/', 'layout')
  return { success: true }
})
