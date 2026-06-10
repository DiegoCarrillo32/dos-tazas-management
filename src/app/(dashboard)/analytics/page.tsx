import {
  fetchAnalyticsSummary,
  fetchRevenueTimeSeries,
  fetchTopRoastLevels,
  fetchTopPrepMethods,
  fetchRoastingAnalytics
} from '@/actions/analytics'
import { fetchSettings } from '@/actions/settings'
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const now = new Date()
  const defaultStartDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const defaultEndDate = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`

  const defaultFilters = { startDate: defaultStartDate, endDate: defaultEndDate }

  const [summary, revenue, roastData, prepData, roasting, settings] = await Promise.all([
    fetchAnalyticsSummary(defaultFilters),
    fetchRevenueTimeSeries(defaultFilters),
    fetchTopRoastLevels(defaultFilters),
    fetchTopPrepMethods(defaultFilters),
    fetchRoastingAnalytics(defaultFilters),
    fetchSettings()
  ])

  return (
    <div className="w-full max-w-7xl mx-auto">
      <AnalyticsDashboard
        initialSummary={summary}
        initialRevenue={revenue}
        initialRoast={roastData}
        initialPrep={prepData}
        initialRoasting={roasting}
        settings={settings}
        defaultStartDate={defaultStartDate}
        defaultEndDate={defaultEndDate}
      />
    </div>
  )
}
