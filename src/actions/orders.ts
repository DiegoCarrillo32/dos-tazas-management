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
    customers: Array.isArray(order.customers) ? order.customers[0] : order.customers
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
    customers: Array.isArray(order.customers) ? order.customers[0] : order.customers
  })) as OrderWithCustomer[]
}

export async function updateOrder(orderId: string, params: OrderUpdateParams) {
  const supabase = await createClient()

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

  revalidatePath('/', 'layout')
  return data
}
