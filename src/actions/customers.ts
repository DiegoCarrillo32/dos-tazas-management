'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CustomerRecord, CustomerInsertParams, CustomerWithLastPurchase, CustomerUpdateParams } from '@/types'

export async function fetchCustomers(): Promise<CustomerWithLastPurchase[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .select('*, orders(order_date)')
    .order('full_name', { ascending: true })

  if (error) {
    console.error('Error fetching customers:', error)
    return []
  }

  return (data || []).map(c => {
    // Supabase returns an array for one-to-many joins
    const orders = Array.isArray(c.orders) ? c.orders : []
    const dates = orders.map((o: { order_date: string }) => o.order_date).filter(Boolean) as string[]
    dates.sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime())
    
    // Remove the nested orders array to match the type cleanly, adding last_purchase_date
    const rest = { ...c }
    delete rest.orders
    return {
      ...rest,
      last_purchase_date: dates.length > 0 ? dates[0] : null
    }
  }) as CustomerWithLastPurchase[]
}

export async function createCustomer(params: CustomerInsertParams): Promise<CustomerRecord> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('You must be logged in to create a customer.')
  }

  const { data, error } = await supabase
    .from('customers')
    .insert([{
      ...params,
      user_id: user.id
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating customer:', error)
    throw new Error(error.message)
  }

  revalidatePath('/', 'layout')
  return data as CustomerRecord
}

export async function updateCustomer(customerId: string, params: CustomerUpdateParams): Promise<CustomerRecord> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .update(params)
    .eq('id', customerId)
    .select()
    .single()

  if (error) {
    console.error('Error updating customer:', error)
    throw new Error(error.message)
  }

  revalidatePath('/', 'layout')
  return data as CustomerRecord
}

export async function deleteCustomer(customerId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', customerId)

  if (error) {
    console.error('Error deleting customer:', error)
    throw new Error(error.message)
  }

  revalidatePath('/', 'layout')
}
