import { fetchCoffeeOptions } from '@/actions/analytics'
import { fetchSettings } from '@/actions/settings'
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'

export const dynamic = 'force-dynamic'

// The dataset is loaded by the dashboard in the browser: date ranges and
// day buckets depend on the viewer's timezone, which the server doesn't know.
export default async function AnalyticsPage() {
  const [coffeeOptions, settings] = await Promise.all([
    fetchCoffeeOptions(),
    fetchSettings()
  ])

  return (
    <div className="w-full max-w-7xl mx-auto">
      <AnalyticsDashboard coffeeOptions={coffeeOptions} settings={settings} />
    </div>
  )
}
