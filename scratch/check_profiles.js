import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function check() {
  const { data: users, error: userErr } = await supabase.auth.admin ? await supabase.auth.admin.listUsers() : { data: null, error: 'No admin' }
  console.log('Users count:', users?.users?.length || 'Unknown')

  const { data: profiles, error } = await supabase.from('user_profiles').select('*')
  console.log('Profiles:', profiles)
  
  if (error) {
    console.error('Error fetching profiles:', error)
  }
}

check()
