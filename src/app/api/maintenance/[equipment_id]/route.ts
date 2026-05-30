import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request, props: { params: Promise<{ equipment_id: string }> }) {
  const params = await props.params;
  const equipmentId = params.equipment_id;

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('maintenance_logs')
    .select('*')
    .eq('equipment_id', equipmentId)
    .order('date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}
