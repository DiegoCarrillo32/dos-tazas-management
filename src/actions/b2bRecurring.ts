'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { B2BRecurringOrderRecord, B2BRecurringOrderInsertParams, B2BRecurringOrderUpdateParams, OrderRecord } from '@/types'
import { findOrCreateB2BCustomer } from '@/utils/b2bCustomer'
import { calculateOrderCosts, calculateRawGrams, roastLossPercentage } from '@/utils/calculations'
import { fetchSettings } from '@/actions/settings'
import { z } from 'zod'

const recurringFields = z.object({
  partner_id: z.string().uuid(),
  inventory_id: z.string().uuid().nullable(),
  preparation_method: z.string().min(1),
  roast_level: z.string().min(1),
  amount_grams: z.number().int().positive(),
  bag_count: z.number().int().positive(),
  bag_type_id: z.string().uuid().nullable(),
  frequency: z.enum(['weekly', 'biweekly', 'monthly']),
  day_of_week: z.number().int().min(0).max(6),
  is_active: z.boolean(),
})
// partner_id is fixed once created.
const recurringUpdate = recurringFields.omit({ partner_id: true }).partial()

function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '))
  }
  return parsed.data
}

export async function getRecurringOrders(partnerId: string) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('b2b_recurring_orders')
    .select('*, inventory(item_name)')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch recurring orders: ${error.message}`)
  }

  return data
}

export async function createRecurringOrder(params: B2BRecurringOrderInsertParams) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('b2b_recurring_orders')
    .insert(parseOrThrow(recurringFields, params))
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create recurring order: ${error.message}`)
  }

  revalidatePath('/b2b')
  return data as B2BRecurringOrderRecord
}

export async function updateRecurringOrder(id: string, params: B2BRecurringOrderUpdateParams) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  // Get the partner_id to revalidate
  const { data: recurringData, error: recurringError } = await supabase
    .from('b2b_recurring_orders')
    .select('partner_id')
    .eq('id', id)
    .single()

  if (recurringError || !recurringData) {
    throw new Error('Recurring order not found.')
  }

  const { data, error } = await supabase
    .from('b2b_recurring_orders')
    .update(parseOrThrow(recurringUpdate, params))
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update recurring order: ${error.message}`)
  }

  revalidatePath('/b2b')
  return data as B2BRecurringOrderRecord
}

export async function deleteRecurringOrder(id: string) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  // Get the partner_id to revalidate
  const { data: recurringData, error: recurringError } = await supabase
    .from('b2b_recurring_orders')
    .select('partner_id')
    .eq('id', id)
    .single()

  if (recurringError || !recurringData) {
    throw new Error('Recurring order not found.')
  }

  const { error } = await supabase
    .from('b2b_recurring_orders')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete recurring order: ${error.message}`)
  }

  revalidatePath('/b2b')
  return true
}

export async function confirmOrderFromTemplate(recurringId: string) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  // 1. Fetch recurring order details
  const { data: recurringOrder, error: recurringError } = await supabase
    .from('b2b_recurring_orders')
    .select('*, partner:b2b_partners(company_name, roaster_user_id, status)')
    .eq('id', recurringId)
    .single()

  if (recurringError || !recurringOrder) {
    throw new Error(`Failed to fetch template: ${recurringError?.message || 'Not found'}`)
  }

  if (recurringOrder.partner.roaster_user_id !== userData.user.id) {
    throw new Error('Only the roaster can generate orders from a standing order.')
  }
  if (!recurringOrder.is_active) {
    throw new Error('This standing order is paused.')
  }
  if (recurringOrder.partner.status !== 'active') {
    throw new Error('This partner is not active.')
  }

  // 2. Fetch custom pricing if any
  let pricePerKg = 0

  if (recurringOrder.inventory_id) {
    // Try custom pricing first
    const { data: customPricing } = await supabase
      .from('b2b_pricing')
      .select('price_per_kg')
      .eq('partner_id', recurringOrder.partner_id)
      .eq('inventory_id', recurringOrder.inventory_id)
      .single()

    if (customPricing) {
      pricePerKg = customPricing.price_per_kg
    } else {
      throw new Error(`No custom pricing set for this coffee bean. Please go to the Custom Pricing tab and set a price per kg for this partner before generating orders.`)
    }
  } else {
    throw new Error('Standing order is missing an inventory item selection.')
  }

  const totalPrice = (recurringOrder.amount_grams / 1000) * pricePerKg

  // 3. Every B2B order still needs a customer row; reuse the one backing this
  // company so standing orders don't spawn duplicates. The order belongs to the
  // roaster, so it is scoped to their user id.
  const roasterId = recurringOrder.partner.roaster_user_id

  const customerId = await findOrCreateB2BCustomer(supabase, {
    userId: roasterId,
    companyName: recurringOrder.partner.company_name,
  })

  // 4. Mirror createOrder: deduct green coffee and persist the cost breakdown,
  // otherwise generated orders show no cost and inventory silently drifts.
  const settings = await fetchSettings()
  const bagCount = recurringOrder.bag_count ?? 1

  const { data: invItem } = await supabase
    .from('inventory')
    .select('cost_per_kg')
    .eq('id', recurringOrder.inventory_id)
    .single()

  const costPerKg = invItem?.cost_per_kg ? Number(invItem.cost_per_kg) : null
  const rawGramsUsed = invItem
    ? calculateRawGrams(recurringOrder.amount_grams, roastLossPercentage(settings))
    : null

  let bagUnitCost: number | null = null
  if (recurringOrder.bag_type_id) {
    const { data: bagType } = await supabase
      .from('bag_types')
      .select('cost')
      .eq('id', recurringOrder.bag_type_id)
      .single()
    if (bagType) bagUnitCost = Number(bagType.cost)
  }

  const { costBreakdown, totalCost } = calculateOrderCosts({
    amountGrams: recurringOrder.amount_grams,
    bagCount,
    settings,
    costPerKg,
    bagUnitCost,
  })

  // 5. Create the actual order
  const { data: newOrder, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: roasterId,
      customer_id: customerId,
      preparation_method: recurringOrder.preparation_method,
      roast_level: recurringOrder.roast_level,
      amount_grams: recurringOrder.amount_grams,
      total_price: totalPrice,
      inventory_id: recurringOrder.inventory_id,
      bag_count: bagCount,
      bag_type_id: recurringOrder.bag_type_id,
      company_name: recurringOrder.partner.company_name,
      partner_id: recurringOrder.partner_id,
      fulfillment_status: 'pending',
      payment_status: 'pending',
      total_cost: totalCost,
      cost_breakdown: costBreakdown,
      raw_grams_used: rawGramsUsed,
    })
    .select()
    .single()

  if (orderError) {
    throw new Error(`Failed to create order from template: ${orderError.message}`)
  }

  // Deduct stock only once the order exists; undo the order if that fails.
  if (rawGramsUsed) {
    const { error: stockError } = await supabase.rpc('adjust_stock', {
      p_inventory_id: recurringOrder.inventory_id,
      p_delta: -rawGramsUsed,
    })
    if (stockError) {
      await supabase.from('orders').delete().eq('id', newOrder.id)
      throw new Error(`Failed to update inventory: ${stockError.message}`)
    }
  }

  revalidatePath('/', 'layout')
  return newOrder as OrderRecord
}
