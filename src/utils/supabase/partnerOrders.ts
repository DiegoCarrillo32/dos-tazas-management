import type { SupabaseClient } from '@supabase/supabase-js'

export async function isPartner(supabase: SupabaseClient): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  return data?.role === 'partner'
}

// Partners read the roaster's orders through this RPC, which omits the
// roaster's cost/margin columns (RLS can't hide columns).
export function partnerOrders(supabase: SupabaseClient) {
  return supabase.rpc('partner_orders', {}, { count: 'exact' })
}

type PartnerOrderRow = { item_name: string | null; customer_name: string | null; customer_phone: string | null }

// Reshape RPC rows to match the joined `orders` select used elsewhere.
export function toOrderWithJoins<T extends PartnerOrderRow>(row: T) {
  const { item_name, customer_name, customer_phone, ...order } = row
  return {
    ...order,
    customers: { full_name: customer_name ?? '', phone: customer_phone },
    inventory: item_name ? { item_name } : null,
  }
}
