'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CustomerRecord, CustomerInsertParams } from '@/types'

export async function fetchCustomers(): Promise<CustomerRecord[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('full_name', { ascending: true })

  if (error) {
    console.error('Error fetching customers:', error)
    return []
  }

  return (data || []) as CustomerRecord[]
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
