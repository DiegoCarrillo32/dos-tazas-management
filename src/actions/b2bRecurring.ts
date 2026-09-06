'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { B2BRecurringOrderRecord, B2BRecurringOrderInsertParams, B2BRecurringOrderUpdateParams, OrderRecord } from '@/types'
import { findOrCreateB2BCustomer } from '@/utils/b2bCustomer'
import { calculateOrderCosts, calculateRawGrams } from '@/utils/calculations'
import { fetchSettings } from '@/actions/settings'

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
    .insert(params)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create recurring order: ${error.message}`)
  }

  revalidatePath(`/dashboard/partners/${params.partner_id}`)
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
    .update(params)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update recurring order: ${error.message}`)
  }

  revalidatePath(`/dashboard/partners/${recurringData.partner_id}`)
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

  revalidatePath(`/dashboard/partners/${recurringData.partner_id}`)
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
    .select('*, partner:b2b_partners(company_name, roaster_user_id)')
    .eq('id', recurringId)
    .single()

  if (recurringError || !recurringOrder) {
    throw new Error(`Failed to fetch template: ${recurringError?.message || 'Not found'}`)
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

  let costPerKg: number | null = null

  const { data: invItem } = await supabase
    .from('inventory')
    .select('stock_grams, cost_per_kg')
    .eq('id', recurringOrder.inventory_id)
    .single()

  if (invItem) {
    costPerKg = invItem.cost_per_kg ? Number(invItem.cost_per_kg) : null
    const rawGramsUsed = calculateRawGrams(recurringOrder.amount_grams, settings.roast_loss_percentage)

    const newStock = invItem.stock_grams - rawGramsUsed
    if (newStock < 0) {
      console.warn(`[Inventory Warning] Stock for item ${recurringOrder.inventory_id} will go negative: ${newStock}g remaining after this standing order.`)
    }
    await supabase
      .from('inventory')
      .update({ stock_grams: newStock })
      .eq('id', recurringOrder.inventory_id)
  }

  const { costBreakdown, totalCost } = calculateOrderCosts({
    amountGrams: recurringOrder.amount_grams,
    bagCount,
    settings,
    costPerKg,
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
      company_name: recurringOrder.partner.company_name,
      partner_id: recurringOrder.partner_id,
      fulfillment_status: 'pending',
      payment_status: 'pending',
      total_cost: totalCost,
      cost_breakdown: costBreakdown,
    })
    .select()
    .single()

  if (orderError) {
    throw new Error(`Failed to create order from template: ${orderError.message}`)
  }

  revalidatePath('/', 'layout')
  return newOrder as OrderRecord
}
