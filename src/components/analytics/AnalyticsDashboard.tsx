'use client'

import { useState, useTransition, useEffect } from 'react'
import { DollarSign, Package, Coffee, Coins } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/analytics/StatCard'
import { SortableStatCard } from '@/components/analytics/SortableStatCard'
import { RevenueChart } from '@/components/analytics/RevenueChart'
import { BreakdownCharts } from '@/components/analytics/BreakdownCharts'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
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
const DEFAULT_CARD_ORDER = ['revenue', 'cost', 'profit', 'margin', 'coffee_sold', 'total_orders']

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

  const [cardOrder, setCardOrder] = useState<string[]>(DEFAULT_CARD_ORDER)
  const [isMounted, setIsMounted] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setIsMounted(true)
    const saved = localStorage.getItem('dos_tazas_analytics_card_order')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length === DEFAULT_CARD_ORDER.length) {
          setCardOrder(parsed)
        }
      } catch {
        // ignore
      }
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setCardOrder((items) => {
        const oldIndex = items.indexOf(active.id as string)
        const newIndex = items.indexOf(over.id as string)
        const newOrder = arrayMove(items, oldIndex, newIndex)
        localStorage.setItem('dos_tazas_analytics_card_order', JSON.stringify(newOrder))
        return newOrder
      })
    }
    setActiveId(null)
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  const cardsConfig = {
    revenue: {
      id: 'revenue',
      title: t('analytics_total_revenue'),
      value: `${currencySymbol}${summary.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-coffee-fruit",
      className: "col-span-12 sm:col-span-6 lg:col-span-4",
    },
    cost: {
      id: 'cost',
      title: t('analytics_total_cost'),
      value: `${currencySymbol}${summary.totalCost.toFixed(2)}`,
      icon: Coins,
      color: "text-red-600",
      className: "col-span-12 sm:col-span-6 lg:col-span-4",
    },
    profit: {
      id: 'profit',
      title: t('analytics_total_profit'),
      value: `${summary.totalProfit >= 0 ? '' : '-'}${currencySymbol}${Math.abs(summary.totalProfit).toFixed(2)}`,
      icon: DollarSign,
      color: summary.totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600',
      className: "col-span-12 sm:col-span-6 lg:col-span-4",
    },
    margin: {
      id: 'margin',
      title: t('analytics_profit_margin'),
      value: `${(summary.totalRevenue > 0 ? (summary.totalProfit / summary.totalRevenue) * 100 : 0).toFixed(1)}%`,
      icon: Coins,
      color: (summary.totalRevenue > 0 ? (summary.totalProfit / summary.totalRevenue) * 100 : 0) >= 0 ? 'text-emerald-600' : 'text-red-600',
      className: "col-span-12 sm:col-span-6 lg:col-span-4",
    },
    coffee_sold: {
      id: 'coffee_sold',
      title: t('analytics_coffee_sold'),
      value: `${(summary.totalCoffeeSoldGrams / 1000).toFixed(2)} kg`,
      subtitle: `${summary.totalCoffeeSoldGrams.toLocaleString()} grams`,
      icon: Coffee,
      color: "text-warm-roast",
      className: "col-span-12 sm:col-span-6 lg:col-span-4",
    },
    total_orders: {
      id: 'total_orders',
      title: t('analytics_total_orders'),
      value: summary.totalOrders.toString(),
      icon: Package,
      color: "text-expresso",
      className: "col-span-12 sm:col-span-6 lg:col-span-4",
    }
  }

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
      <div className="bg-white/70 backdrop-blur-md border border-warm-roast/10 rounded-xl p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="space-y-1.5 w-full">
            <Label className="text-expresso text-xs font-semibold">Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border-warm-roast/30 focus-visible:ring-coffee-fruit text-sm w-full bg-white/80 focus:bg-white transition-colors"
            />
          </div>
          <div className="space-y-1.5 w-full">
            <Label className="text-expresso text-xs font-semibold">End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border-warm-roast/30 focus-visible:ring-coffee-fruit text-sm w-full bg-white/80 focus:bg-white transition-colors"
            />
          </div>
          <div className="space-y-1.5 w-full">
            <Label className="text-expresso text-xs font-semibold">Payment</Label>
            <Select value={paymentFilter} onValueChange={(val) => setPaymentFilter((val || 'all') as PaymentStatus | 'all')}>
              <SelectTrigger className="border-warm-roast/30 focus:ring-coffee-fruit text-sm w-full bg-white/80 focus:bg-white transition-colors">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 w-full">
            <Label className="text-expresso text-xs font-semibold">Fulfillment</Label>
            <Select value={fulfillmentFilter} onValueChange={(val) => setFulfillmentFilter((val || 'all') as FulfillmentStatus | 'all')}>
              <SelectTrigger className="border-warm-roast/30 focus:ring-coffee-fruit text-sm w-full bg-white/80 focus:bg-white transition-colors">
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
          <div className="flex gap-2 w-full sm:col-span-2 lg:col-span-1">
            <Button
              onClick={applyFilters}
              disabled={isPending}
              className="bg-coffee-fruit hover:bg-warm-roast text-white flex-1 transition-colors shadow-sm"
              size="default"
            >
              {isPending ? 'Loading...' : 'Apply'}
            </Button>
            <Button
              onClick={clearFilters}
              disabled={isPending}
              variant="outline"
              className="text-expresso border-warm-roast/30 hover:bg-warm-roast/5 flex-1 transition-colors"
              size="default"
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {isMounted ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
          modifiers={[restrictToWindowEdges]}
        >
          <SortableContext items={cardOrder} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-12 gap-4">
              {cardOrder.map((id) => {
                const config = cardsConfig[id as keyof typeof cardsConfig]
                return config ? <SortableStatCard key={config.id} {...config} /> : null
              })}
            </div>
          </SortableContext>
          <DragOverlay adjustScale={false}>
            {activeId && cardsConfig[activeId as keyof typeof cardsConfig] ? (
              <div className="w-full h-full opacity-90 cursor-grabbing shadow-2xl rounded-xl ring-2 ring-coffee-fruit/20">
                <StatCard {...cardsConfig[activeId as keyof typeof cardsConfig]} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="grid grid-cols-12 gap-4">
          {DEFAULT_CARD_ORDER.map((id) => {
            const config = cardsConfig[id as keyof typeof cardsConfig]
            return config ? (
              <div key={config.id} className={config.className}>
                <StatCard {...config} />
              </div>
            ) : null
          })}
        </div>
      )}

      {/* Revenue Chart */}
      <RevenueChart data={revenue} currencySymbol={currencySymbol} />

      {/* Breakdown Charts */}
      <BreakdownCharts roastData={roastData} prepData={prepData} />
    </div>
  )
}
