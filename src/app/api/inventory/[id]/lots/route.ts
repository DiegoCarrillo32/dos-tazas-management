import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const inventoryId = params.id;

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('green_coffee_lots')
    .select('*')
    .eq('inventory_id', inventoryId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}
