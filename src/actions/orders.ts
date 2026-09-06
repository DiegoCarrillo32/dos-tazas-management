'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type { FulfillmentStatus, PaymentStatus, OrderWithCustomer } from '@/types'
import { authActionClient } from '@/lib/safe-action'
import { orderSchema } from '@/lib/schemas'
import { B2B_AUTO_CUSTOMER_ID, findOrCreateB2BCustomer } from '@/utils/b2bCustomer'
import * as z from 'zod'

export async function fetchOrders(): Promise<OrderWithCustomer[]> {
  const supabase = await createClient()

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers (
        full_name,
        phone
      ),
      inventory (
        item_name
      )
    `)
    .or('fulfillment_status.neq.delivered,payment_status.neq.paid')
    .order('order_date', { ascending: false })

  if (error) {
    console.error('Error fetching orders:', error)
    return []
  }

  return (orders || []).map(order => ({
    ...order,
    customers: Array.isArray(order.customers) ? order.customers[0] : order.customers,
    inventory: Array.isArray(order.inventory) ? order.inventory[0] : order.inventory
  })) as OrderWithCustomer[]
}

export const createOrder = authActionClient
  .schema(orderSchema)
  .action(async ({ parsedInput: params, ctx: { user, supabase } }) => {

  // Handle B2B auto customer resolution. The form submits a sentinel instead of
  // a customer id: resolve it from the linked partner, or from the typed
  // company name when the order is a manual (unlinked) B2B entry.
  let customerId = params.customer_id
  if (customerId === B2B_AUTO_CUSTOMER_ID) {
    let companyName = params.company_name?.trim() || ''
    let contactPhone: string | null = null

    if (params.partner_id) {
      const { data: partner, error: partnerError } = await supabase
        .from('b2b_partners')
        .select('company_name, contact_phone')
        .eq('id', params.partner_id)
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

    customerId = await findOrCreateB2BCustomer(supabase, {
      userId: user.id,
      companyName,
      phone: contactPhone,
    })
  }

  // Fetch settings for roasting loss and cost rates
  const { fetchSettings } = await import('./settings')
  const settings = await fetchSettings()
  const bagCount = params.bag_count ?? 1

  // Compute cost breakdown
  let costPerKg: number | null = null
  let rawGramsUsed = 0

  if (params.inventory_id && params.amount_grams) {
    const { data: invItem } = await supabase
      .from('inventory')
      .select('stock_grams, cost_per_kg')
      .eq('id', params.inventory_id)
      .single()

    if (invItem) {
      costPerKg = invItem.cost_per_kg ? Number(invItem.cost_per_kg) : null
      const { calculateRawGrams } = await import('@/utils/calculations')
      rawGramsUsed = calculateRawGrams(params.amount_grams, settings.roast_loss_percentage)

      // Deduct from inventory
      const newStock = invItem.stock_grams - rawGramsUsed
      if (newStock < 0) {
        console.warn(`[Inventory Warning] Stock for item ${params.inventory_id} will go negative: ${newStock}g remaining after this order.`)
      }
      await supabase
        .from('inventory')
        .update({ stock_grams: newStock })
        .eq('id', params.inventory_id)
    }
  }

  const { calculateOrderCosts } = await import('@/utils/calculations')
  const { costBreakdown, totalCost } = calculateOrderCosts({
    amountGrams: params.amount_grams ?? 0,
    bagCount,
    settings,
    costPerKg
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
      cost_breakdown: costBreakdown
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating order:', error)
    throw new Error(error.message)
  }

  revalidatePath('/', 'layout')
  return data
})

export const updateFulfillmentStatus = authActionClient
  .schema(z.object({ id: z.string(), status: z.custom<FulfillmentStatus>() }))
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
  .schema(z.object({ id: z.string(), status: z.custom<PaymentStatus>() }))
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

export async function fetchCompletedOrders(): Promise<OrderWithCustomer[]> {
  const supabase = await createClient()

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers (
        full_name,
        phone
      ),
      inventory (
        item_name
      )
    `)
    .eq('fulfillment_status', 'delivered')
    .eq('payment_status', 'paid')
    .order('order_date', { ascending: false })

  if (error) {
    console.error('Error fetching completed orders:', error)
    return []
  }

  return (orders || []).map(order => ({
    ...order,
    customers: Array.isArray(order.customers) ? order.customers[0] : order.customers,
    inventory: Array.isArray(order.inventory) ? order.inventory[0] : order.inventory
  })) as OrderWithCustomer[]
}

export const updateOrder = authActionClient
  .schema(z.object({ id: z.string(), params: orderSchema.partial() }))
  .action(async ({ parsedInput: { id: orderId, params }, ctx: { supabase } }) => {

  // 1. Fetch original order details to reconcile inventory
  const { data: oldOrder, error: fetchError } = await supabase
    .from('orders')
    .select('inventory_id, amount_grams, bag_count')
    .eq('id', orderId)
    .single()

  if (fetchError) {
    console.error('Error fetching old order details:', fetchError)
    throw new Error('Failed to retrieve original order details for inventory reconciliation.')
  }

  // Fetch settings for roasting loss and cost rates
  const { fetchSettings } = await import('./settings')
  const settings = await fetchSettings()

  // 2. Reconcile inventory if inventory_id or amount_grams is updated
  const inventoryChanged = params.inventory_id !== undefined || params.amount_grams !== undefined

  if (inventoryChanged) {
    try {
      const newInventoryId = params.inventory_id !== undefined ? params.inventory_id : oldOrder.inventory_id
      const newAmountGrams = params.amount_grams !== undefined ? params.amount_grams : oldOrder.amount_grams
      const sameBean = newInventoryId === oldOrder.inventory_id

      const { calculateRawGrams } = await import('@/utils/calculations')

      if (sameBean && oldOrder.inventory_id && oldOrder.amount_grams && newAmountGrams) {
        // Optimized path: same bean — compute diff and do a single SELECT + UPDATE
        const oldRawGrams = calculateRawGrams(oldOrder.amount_grams, settings.roast_loss_percentage)
        const newRawGrams = calculateRawGrams(newAmountGrams, settings.roast_loss_percentage)
        const diffGrams = newRawGrams - oldRawGrams

        if (diffGrams !== 0) {
          const { data: invItem } = await supabase
            .from('inventory')
            .select('stock_grams')
            .eq('id', oldOrder.inventory_id)
            .single()

          if (invItem) {
            const updatedStock = invItem.stock_grams - diffGrams
            if (updatedStock < 0) {
              console.warn(`[Inventory Warning] Stock for item ${oldOrder.inventory_id} will go negative: ${updatedStock}g remaining after this order update.`)
            }
            await supabase
              .from('inventory')
              .update({ stock_grams: updatedStock })
              .eq('id', oldOrder.inventory_id)
          }
        }
      } else {
        // Different bean — revert old deduction, then apply new deduction
        // Step A: Revert old inventory deduction
        if (oldOrder.inventory_id && oldOrder.amount_grams) {
          const { data: oldInvItem } = await supabase
            .from('inventory')
            .select('stock_grams')
            .eq('id', oldOrder.inventory_id)
            .single()

          if (oldInvItem) {
            const oldRawGrams = calculateRawGrams(oldOrder.amount_grams, settings.roast_loss_percentage)
            await supabase
              .from('inventory')
              .update({ stock_grams: oldInvItem.stock_grams + oldRawGrams })
              .eq('id', oldOrder.inventory_id)
          }
        }

        // Step B: Apply new inventory deduction
        if (newInventoryId && newAmountGrams) {
          const { data: newInvItem } = await supabase
            .from('inventory')
            .select('stock_grams')
            .eq('id', newInventoryId)
            .single()

          if (newInvItem) {
            const newRawGrams = calculateRawGrams(newAmountGrams, settings.roast_loss_percentage)
            const updatedStock = newInvItem.stock_grams - newRawGrams
            if (updatedStock < 0) {
              console.warn(`[Inventory Warning] Stock for item ${newInventoryId} will go negative: ${updatedStock}g remaining after this order update.`)
            }
            await supabase
              .from('inventory')
              .update({ stock_grams: updatedStock })
              .eq('id', newInventoryId)
          }
        }
      }
    } catch (invErr) {
      console.error('Failed to reconcile inventory after order update:', invErr)
    }
  }

  // 3. Recompute cost breakdown if cost-relevant fields changed
  const costRelevantChange = params.inventory_id !== undefined ||
    params.amount_grams !== undefined ||
    params.bag_count !== undefined

  let costUpdate: Record<string, unknown> = {}

  if (costRelevantChange) {
    const finalInventoryId = params.inventory_id !== undefined ? params.inventory_id : oldOrder.inventory_id
    const finalAmountGrams = params.amount_grams !== undefined ? params.amount_grams : oldOrder.amount_grams
    const finalBagCount = params.bag_count !== undefined ? params.bag_count : (oldOrder.bag_count ?? 1)

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

    const { calculateOrderCosts } = await import('@/utils/calculations')
    const { costBreakdown, totalCost } = calculateOrderCosts({
      amountGrams: finalAmountGrams ?? 0,
      bagCount: finalBagCount,
      settings,
      costPerKg
    })

    costUpdate = { total_cost: totalCost, cost_breakdown: costBreakdown }
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
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id: orderId }, ctx: { supabase } }) => {

  // 1. Fetch original order details to reconcile inventory
  const { data: oldOrder, error: fetchError } = await supabase
    .from('orders')
    .select('inventory_id, amount_grams')
    .eq('id', orderId)
    .single()

  if (fetchError) {
    console.error('Error fetching old order details:', fetchError)
    throw new Error('Failed to retrieve order details for deletion.')
  }

  // 2. Revert inventory deduction if applicable
  if (oldOrder.inventory_id && oldOrder.amount_grams) {
    try {
      const { fetchSettings } = await import('./settings')
      const settings = await fetchSettings()
      const { calculateRawGrams } = await import('@/utils/calculations')

      const { data: invItem } = await supabase
        .from('inventory')
        .select('stock_grams')
        .eq('id', oldOrder.inventory_id)
        .single()

      if (invItem) {
        const rawGrams = calculateRawGrams(oldOrder.amount_grams, settings.roast_loss_percentage)
        await supabase
          .from('inventory')
          .update({ stock_grams: invItem.stock_grams + rawGrams })
          .eq('id', oldOrder.inventory_id)
      }
    } catch (invErr) {
      console.error('Failed to restore inventory during order deletion:', invErr)
    }
  }

  // 3. Delete order
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId)

  if (error) {
    console.error('Error deleting order:', error)
    throw new Error(error.message)
  }

  revalidatePath('/', 'layout')
  return { success: true }
})
