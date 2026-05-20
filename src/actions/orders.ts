'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type { FulfillmentStatus, PaymentStatus, OrderInsertParams, OrderUpdateParams, OrderWithCustomer } from '@/types'

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

export async function createOrder(params: OrderInsertParams) {
  const supabase = await createClient()

  // Get the current user's ID from the session
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('You must be logged in to create an order.')
  }

  const { data, error } = await supabase
    .from('orders')
    .insert([{
      ...params,
      user_id: user.id,
      fulfillment_status: 'pending',
      payment_status: 'pending'
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating order:', error)
    throw new Error(error.message)
  }

  // Deduct from inventory if provided
  if (params.inventory_id && params.amount_grams) {
    const { data: invItem } = await supabase
      .from('inventory')
      .select('stock_grams')
      .eq('id', params.inventory_id)
      .single()
      
    if (invItem) {
      // Fetch user settings for roasting loss
      const { fetchSettings } = await import('./settings')
      const settings = await fetchSettings()
      
      const lossRatio = 1 - (settings.roast_loss_percentage / 100)
      
      // Apply dynamic roasting loss to find raw grams used
      const rawGramsUsed = Math.ceil(params.amount_grams / lossRatio)
      const newStock = invItem.stock_grams - rawGramsUsed
      
      await supabase
        .from('inventory')
        .update({ stock_grams: newStock })
        .eq('id', params.inventory_id)
    }
  }

  revalidatePath('/', 'layout')
  return data
}

export async function updateFulfillmentStatus(orderId: string, status: FulfillmentStatus) {
  const supabase = await createClient()

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
}

export async function updatePaymentStatus(orderId: string, status: PaymentStatus) {
  const supabase = await createClient()

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
}

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

export async function updateOrder(orderId: string, params: OrderUpdateParams) {
  const supabase = await createClient()

  // 1. Fetch original order details to reconcile inventory
  const { data: oldOrder, error: fetchError } = await supabase
    .from('orders')
    .select('inventory_id, amount_grams')
    .eq('id', orderId)
    .single()

  if (fetchError) {
    console.error('Error fetching old order details:', fetchError)
    throw new Error('Failed to retrieve original order details for inventory reconciliation.')
  }

  // 2. Perform database update
  const { data, error } = await supabase
    .from('orders')
    .update(params)
    .eq('id', orderId)
    .select()
    .single()

  if (error) {
    console.error('Error updating order:', error)
    throw new Error(error.message)
  }

  // 3. Reconcile inventory if inventory_id or amount_grams is updated
  const inventoryChanged = params.inventory_id !== undefined || params.amount_grams !== undefined

  if (inventoryChanged) {
    try {
      const { fetchSettings } = await import('./settings')
      const settings = await fetchSettings()
      const lossRatio = 1 - (settings.roast_loss_percentage / 100)

      // Step A: Revert old inventory deduction
      if (oldOrder.inventory_id && oldOrder.amount_grams) {
        const { data: oldInvItem } = await supabase
          .from('inventory')
          .select('stock_grams')
          .eq('id', oldOrder.inventory_id)
          .single()

        if (oldInvItem) {
          const oldRawGrams = Math.ceil(oldOrder.amount_grams / lossRatio)
          await supabase
            .from('inventory')
            .update({ stock_grams: oldInvItem.stock_grams + oldRawGrams })
            .eq('id', oldOrder.inventory_id)
        }
      }

      // Step B: Apply new inventory deduction
      const newInventoryId = params.inventory_id !== undefined ? params.inventory_id : oldOrder.inventory_id
      const newAmountGrams = params.amount_grams !== undefined ? params.amount_grams : oldOrder.amount_grams

      if (newInventoryId && newAmountGrams) {
        const { data: newInvItem } = await supabase
          .from('inventory')
          .select('stock_grams')
          .eq('id', newInventoryId)
          .single()

        if (newInvItem) {
          const newRawGrams = Math.ceil(newAmountGrams / lossRatio)
          await supabase
            .from('inventory')
            .update({ stock_grams: newInvItem.stock_grams - newRawGrams })
            .eq('id', newInventoryId)
        }
      }
    } catch (invErr) {
      console.error('Failed to reconcile inventory after order update:', invErr)
    }
  }

  revalidatePath('/', 'layout')
  return data
}

export async function deleteOrder(orderId: string) {
  const supabase = await createClient()

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
      const lossRatio = 1 - (settings.roast_loss_percentage / 100)

      const { data: invItem } = await supabase
        .from('inventory')
        .select('stock_grams')
        .eq('id', oldOrder.inventory_id)
        .single()

      if (invItem) {
        const rawGrams = Math.ceil(oldOrder.amount_grams / lossRatio)
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
}
