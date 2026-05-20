'use client'

import { useState, useTransition } from 'react'
import { DollarSign, Package, Coffee, Coins } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/analytics/StatCard'
import { RevenueChart } from '@/components/analytics/RevenueChart'
import { BreakdownCharts } from '@/components/analytics/BreakdownCharts'
import { useTranslation } from '@/i18n/LanguageProvider'
import {
  fetchAnalyticsSummary,
  fetchRevenueTimeSeries,
  fetchTopRoastLevels,
  fetchTopPrepMethods
} from '@/actions/analytics'
import type {
  AnalyticsSummary,
  RevenueDataPoint,
  BreakdownItem,
  AnalyticsFilters,
  FulfillmentStatus,
  PaymentStatus,
  UserSettingsRecord
} from '@/types'

interface AnalyticsDashboardProps {
  initialSummary: AnalyticsSummary
  initialRevenue: RevenueDataPoint[]
  initialRoast: BreakdownItem[]
  initialPrep: BreakdownItem[]
  settings?: UserSettingsRecord
}

export function AnalyticsDashboard({
  initialSummary,
  initialRevenue,
  initialRoast,
  initialPrep,
  settings
}: AnalyticsDashboardProps) {
  const { t } = useTranslation()
  const currencySymbol = settings?.currency_symbol || '$'
  const [isPending, startTransition] = useTransition()
  const [summary, setSummary] = useState(initialSummary)
  const [revenue, setRevenue] = useState(initialRevenue)
  const [roastData, setRoastData] = useState(initialRoast)
  const [prepData, setPrepData] = useState(initialPrep)

  // Filter state
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'all'>('all')
  const [fulfillmentFilter, setFulfillmentFilter] = useState<FulfillmentStatus | 'all'>('all')

  const applyFilters = () => {
    const filters: AnalyticsFilters = {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      paymentStatus: paymentFilter,
      fulfillmentStatus: fulfillmentFilter
    }

    startTransition(async () => {
      const [newSummary, newRevenue, newRoast, newPrep] = await Promise.all([
        fetchAnalyticsSummary(filters),
        fetchRevenueTimeSeries(filters),
        fetchTopRoastLevels(filters),
        fetchTopPrepMethods(filters)
      ])
      setSummary(newSummary)
      setRevenue(newRevenue)
      setRoastData(newRoast)
      setPrepData(newPrep)
    })
  }

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
    setPaymentFilter('all')
    setFulfillmentFilter('all')

    startTransition(async () => {
      const [newSummary, newRevenue, newRoast, newPrep] = await Promise.all([
        fetchAnalyticsSummary({}),
        fetchRevenueTimeSeries({}),
        fetchTopRoastLevels({}),
        fetchTopPrepMethods({})
      ])
      setSummary(newSummary)
      setRevenue(newRevenue)
      setRoastData(newRoast)
      setPrepData(newPrep)
    })
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white/60 border border-warm-roast/10 rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="space-y-1.5">
            <Label className="text-expresso text-xs font-semibold">Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border-warm-roast/30 focus-visible:ring-coffee-fruit text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-expresso text-xs font-semibold">End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border-warm-roast/30 focus-visible:ring-coffee-fruit text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-expresso text-xs font-semibold">Payment</Label>
            <Select value={paymentFilter} onValueChange={(val) => setPaymentFilter((val || 'all') as PaymentStatus | 'all')}>
              <SelectTrigger className="border-warm-roast/30 focus:ring-coffee-fruit text-sm">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-expresso text-xs font-semibold">Fulfillment</Label>
            <Select value={fulfillmentFilter} onValueChange={(val) => setFulfillmentFilter((val || 'all') as FulfillmentStatus | 'all')}>
              <SelectTrigger className="border-warm-roast/30 focus:ring-coffee-fruit text-sm">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="roasted">Roasted</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={applyFilters}
              disabled={isPending}
              className="bg-coffee-fruit hover:bg-warm-roast text-white flex-1"
              size="sm"
            >
              {isPending ? 'Loading...' : 'Apply'}
            </Button>
            <Button
              onClick={clearFilters}
              disabled={isPending}
              variant="outline"
              className="text-expresso border-warm-roast/30"
              size="sm"
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title={t('analytics_total_revenue')}
          value={`${currencySymbol}${summary.totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          color="text-coffee-fruit"
        />
        <StatCard
          title={t('analytics_total_cost')}
          value={`${currencySymbol}${summary.totalCost.toFixed(2)}`}
          icon={Coins}
          color="text-red-600"
        />
        <StatCard
          title={t('analytics_total_profit')}
          value={`${summary.totalProfit >= 0 ? '' : '-'}${currencySymbol}${Math.abs(summary.totalProfit).toFixed(2)}`}
          icon={DollarSign}
          color={summary.totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}
        />
        <StatCard
          title={t('analytics_profit_margin')}
          value={`${(summary.totalRevenue > 0 ? (summary.totalProfit / summary.totalRevenue) * 100 : 0).toFixed(1)}%`}
          icon={Coins}
          color={(summary.totalRevenue > 0 ? (summary.totalProfit / summary.totalRevenue) * 100 : 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}
        />
        <StatCard
          title={t('analytics_coffee_sold')}
          value={`${(summary.totalCoffeeSoldGrams / 1000).toFixed(2)} kg`}
          subtitle={`${summary.totalCoffeeSoldGrams.toLocaleString()} grams`}
          icon={Coffee}
          color="text-warm-roast"
        />
        <StatCard
          title={t('analytics_total_orders')}
          value={summary.totalOrders.toString()}
          icon={Package}
          color="text-expresso"
        />
      </div>

      {/* Revenue Chart */}
      <RevenueChart data={revenue} currencySymbol={currencySymbol} />

      {/* Breakdown Charts */}
      <BreakdownCharts roastData={roastData} prepData={prepData} />
    </div>
  )
}
