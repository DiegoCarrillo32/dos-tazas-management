import type { createClient } from '@/utils/supabase/server'

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>

/**
 * Sentinel `customer_id` the B2B order form submits before a real customer is
 * known. The roaster picks a partner (or types a company name) instead of a
 * customer, so the customer record is resolved server-side. This value must
 * never reach the database — `orders.customer_id` is a NOT NULL uuid.
 */
export const B2B_AUTO_CUSTOMER_ID = 'B2B_AUTO'

/**
 * Find (or create) the customer record that backs a wholesale company.
 *
 * B2B orders are placed against a company, but `orders` still requires a
 * customer row, so every company gets a matching customer keyed on
 * `full_name`. Shared by the manual B2B order form and by standing-order
 * generation so both reuse the same record instead of creating duplicates.
 */
export async function findOrCreateB2BCustomer(
  supabase: ServerSupabaseClient,
  { userId, companyName, phone }: { userId: string; companyName: string; phone?: string | null }
): Promise<string> {
  const fullName = companyName.trim()

  if (!fullName) {
    throw new Error('A company name is required to create a B2B order.')
  }

  const { data: existing } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', userId)
    .eq('full_name', fullName)
    .limit(1)
    .maybeSingle()

  if (existing) {
    return existing.id
  }

  const { data: created, error } = await supabase
    .from('customers')
    .insert({
      full_name: fullName,
      phone: phone || null,
      user_id: userId,
    })
    .select('id')
    .single()

  if (error || !created) {
    throw new Error(
      `Failed to create a customer record for "${fullName}": ${error?.message || 'unknown error'}`
    )
  }

  return created.id
}
