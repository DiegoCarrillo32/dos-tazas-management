'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type { FulfillmentStatus, PaymentStatus, OrderInsertParams, OrderWithCustomer } from '@/types'

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
