'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CustomerRecord, CustomerWithLastPurchase } from '@/types'
import { authActionClient } from '@/lib/safe-action'
import { customerSchema } from '@/lib/schemas'
import * as z from 'zod'

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

export const createCustomer = authActionClient
  .schema(customerSchema)
  .action(async ({ parsedInput: params, ctx: { user, supabase } }): Promise<CustomerRecord> => {
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
  })

export const updateCustomer = authActionClient
  .schema(z.object({ id: z.string(), params: customerSchema.partial() }))
  .action(async ({ parsedInput: { id, params }, ctx: { supabase } }): Promise<CustomerRecord> => {
    const { data, error } = await supabase
      .from('customers')
      .update(params)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating customer:', error)
      throw new Error(error.message)
    }

    revalidatePath('/', 'layout')
    return data as CustomerRecord
  })

export const deleteCustomer = authActionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { supabase } }): Promise<void> => {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting customer:', error)
      throw new Error(error.message)
    }

    revalidatePath('/', 'layout')
  })
