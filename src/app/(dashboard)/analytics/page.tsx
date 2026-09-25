import { fetchAnalyticsDataset, fetchCoffeeOptions } from '@/actions/analytics'
import { fetchSettings } from '@/actions/settings'
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const now = new Date()
  const defaultStartDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const defaultEndDate = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`

  const [dataset, coffeeOptions, settings] = await Promise.all([
    fetchAnalyticsDataset({ startDate: defaultStartDate, endDate: defaultEndDate }),
    fetchCoffeeOptions(),
    fetchSettings()
  ])

  return (
    <div className="w-full max-w-7xl mx-auto">
      <AnalyticsDashboard
        initialDataset={dataset}
        coffeeOptions={coffeeOptions}
        settings={settings}
        defaultStartDate={defaultStartDate}
        defaultEndDate={defaultEndDate}
      />
    </div>
  )
}
