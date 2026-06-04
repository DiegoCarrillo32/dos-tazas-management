import { fetchSettings } from '@/actions/settings'
import { getMyEmployer } from '@/actions/team'
import { SettingsForm } from '@/components/SettingsForm'
import { Settings } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const settings = await fetchSettings()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let userRole = 'roaster'
  let workerName = ''

  if (user) {
    const { data: profile } = await supabase.from('user_profiles').select('role').eq('user_id', user.id).single()
    if (profile?.role) userRole = profile.role

    if (userRole === 'worker') {
      const employer = await getMyEmployer()
      if (employer?.name) {
        workerName = employer.name
      }
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-heading text-expresso flex items-center gap-3">
            <Settings className="h-8 w-8 text-coffee-fruit" />
            Settings
          </h1>
          <p className="text-expresso/70 font-medium text-sm">Configure your app preferences and calculation formulas.</p>
        </div>
      </div>

      <SettingsForm initialData={settings} userRole={userRole} workerName={workerName} />
    </div>
  )
}
