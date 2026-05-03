import {
  fetchAnalyticsSummary,
  fetchRevenueTimeSeries,
  fetchTopRoastLevels,
  fetchTopPrepMethods
} from '@/actions/analytics'
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const [summary, revenue, roastData, prepData] = await Promise.all([
    fetchAnalyticsSummary(),
    fetchRevenueTimeSeries(),
    fetchTopRoastLevels(),
    fetchTopPrepMethods()
  ])

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-heading text-expresso">Analytics</h1>
        <p className="text-expresso/70 font-medium text-sm">Revenue, sales trends, and product breakdown.</p>
      </div>

      <AnalyticsDashboard
        initialSummary={summary}
        initialRevenue={revenue}
        initialRoast={roastData}
        initialPrep={prepData}
      />
    </div>
  )
}
