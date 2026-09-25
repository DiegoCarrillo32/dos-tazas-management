'use client'

import { useState, useTransition, useEffect, useMemo } from 'react'
import {
  DollarSign, Package, Coffee, Coins, Flame, Hammer, Percent, Receipt, Scale, Users, Wallet,
  LayoutDashboard, ShoppingBag, UserRound, Settings2
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/PageHeader'
import { PageSkeleton } from '@/components/Skeletons'
import { LoadError } from '@/components/LoadError'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { StatCard, type StatCardProps } from '@/components/analytics/StatCard'
import { SortableStatCard } from '@/components/analytics/SortableStatCard'
import { RevenueChart } from '@/components/analytics/RevenueChart'
import { InsightsPanel } from '@/components/analytics/InsightsPanel'
import { ChannelCard } from '@/components/analytics/ChannelCard'
import { CoffeesSoldCard } from '@/components/analytics/CoffeesSoldCard'
import { WeekdayChart } from '@/components/analytics/WeekdayChart'
import { ProductMix } from '@/components/analytics/ProductMix'
import { CostStructure } from '@/components/analytics/CostStructure'
import { CustomerInsights } from '@/components/analytics/CustomerInsights'
import { OperationsPanel } from '@/components/analytics/OperationsPanel'
import { ExportMenu } from '@/components/analytics/ExportMenu'
import { fillTemplate, useAnalyticsFormat } from '@/components/analytics/chart-theme'
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
import { fetchAnalyticsDataset } from '@/actions/analytics'
import { computeAnalytics, pctChange } from '@/utils/analytics-insights'
import type {
  AnalyticsDataset,
  AnalyticsFilters,
  CoffeeOption,
  FulfillmentStatus,
  PaymentStatus,
  UserSettingsRecord,
} from '@/types'

interface AnalyticsDashboardProps {
  coffeeOptions: CoffeeOption[]
  settings?: UserSettingsRecord
}

const EMPTY_DATASET: AnalyticsDataset = {
  filters: {}, orders: [], previousOrders: null, history: [], unpaid: [], roasting: []
}

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// The viewer's current calendar month.
function currentMonth(): { startDate: string; endDate: string } {
  const now = new Date()
  return {
    startDate: ymd(new Date(now.getFullYear(), now.getMonth(), 1)),
    endDate: ymd(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  }
}

const CARD_ORDER_KEY = 'dos_tazas_analytics_card_order'

const DEFAULT_CARD_ORDER = [
  'revenue', 'cost', 'profit', 'margin', 'coffee_sold', 'total_orders',
  'aov', 'revenue_per_kg', 'customers', 'unpaid',
  'roasting_revenue', 'roasting_jobs',
]

// Keeps a saved order's known cards and appends any added since it was saved.
function mergeCardOrder(saved: unknown): string[] {
  if (!Array.isArray(saved)) return DEFAULT_CARD_ORDER
  const known = saved.filter((id): id is string => DEFAULT_CARD_ORDER.includes(id))
  return [...known, ...DEFAULT_CARD_ORDER.filter((id) => !known.includes(id))]
}

type CardConfig = Omit<StatCardProps, 'dragHandleProps' | 'changeLabel'> & { id: string }

const TAB_TRIGGER = 'flex-1 min-w-0 rounded-lg data-active:bg-coffee-fruit/10 data-active:text-coffee-fruit text-expresso/70 transition-all py-2 text-xs sm:text-sm'

export function AnalyticsDashboard({
  coffeeOptions,
  settings,
}: AnalyticsDashboardProps) {
  const format = useAnalyticsFormat(settings?.currency_symbol || '$')
  const { t, money, shortMoney, pct, kg, number } = format
  const [isPending, startTransition] = useTransition()
  const [dataset, setDataset] = useState(EMPTY_DATASET)
  const [loaded, setLoaded] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const report = useMemo(() => computeAnalytics(dataset), [dataset])
  const { kpis, previousKpis, roasting } = report

  const [cardOrder, setCardOrder] = useState<string[]>(DEFAULT_CARD_ORDER)
  const [isMounted, setIsMounted] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setIsMounted(true)
    try {
      const saved = localStorage.getItem(CARD_ORDER_KEY)
      if (saved) setCardOrder(mergeCardOrder(JSON.parse(saved)))
    } catch {
      // ignore
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
        localStorage.setItem(CARD_ORDER_KEY, JSON.stringify(newOrder))
        return newOrder
      })
    }
    setActiveId(null)
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  const changeLabel = t('analytics_vs_previous')
  const delta = (key: 'revenue' | 'cost' | 'profit' | 'orders' | 'grams' | 'aov' | 'revenuePerKg' | 'customers') =>
    previousKpis ? pctChange(kpis[key], previousKpis[key]) : null
  const marginDelta =
    kpis.margin !== null && previousKpis?.margin != null ? kpis.margin - previousKpis.margin : null
  const cardClass = 'col-span-6 lg:col-span-3'

  const baseCards: Record<string, CardConfig> = {
    revenue: {
      id: 'revenue',
      title: t('analytics_total_revenue'),
      value: money(kpis.revenue),
      mobileValue: shortMoney(kpis.revenue),
      icon: DollarSign,
      color: 'text-coffee-fruit',
      change: delta('revenue'),
    },
    cost: {
      id: 'cost',
      title: t('analytics_total_cost'),
      value: money(kpis.cost),
      mobileValue: shortMoney(kpis.cost),
      icon: Coins,
      color: 'text-red-600',
      change: delta('cost'),
      invertChange: true,
    },
    profit: {
      id: 'profit',
      title: t('analytics_total_profit'),
      value: money(kpis.profit),
      mobileValue: shortMoney(kpis.profit),
      icon: Wallet,
      color: kpis.profit >= 0 ? 'text-emerald-600' : 'text-red-600',
      change: delta('profit'),
    },
    margin: {
      id: 'margin',
      title: t('analytics_profit_margin'),
      value: pct(kpis.margin),
      subtitle: marginDelta === null ? undefined : `${marginDelta >= 0 ? '+' : ''}${number(marginDelta, 1)} pts ${changeLabel}`,
      icon: Percent,
      color: (kpis.margin ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600',
    },
    coffee_sold: {
      id: 'coffee_sold',
      title: t('analytics_coffee_sold'),
      value: kg(kpis.grams),
      icon: Coffee,
      color: 'text-warm-roast',
      change: delta('grams'),
    },
    total_orders: {
      id: 'total_orders',
      title: t('analytics_total_orders'),
      value: number(kpis.orders),
      icon: Package,
      color: 'text-expresso',
      change: delta('orders'),
    },
    aov: {
      id: 'aov',
      title: t('analytics_aov'),
      value: money(kpis.aov),
      mobileValue: shortMoney(kpis.aov),
      icon: Receipt,
      color: 'text-expresso',
      change: delta('aov'),
    },
    revenue_per_kg: {
      id: 'revenue_per_kg',
      title: t('analytics_revenue_per_kg'),
      value: money(kpis.revenuePerKg),
      mobileValue: shortMoney(kpis.revenuePerKg),
      subtitle: `${t('analytics_cost_per_kg')}: ${money(kpis.costPerKg)}`,
      icon: Scale,
      color: 'text-warm-roast',
      change: delta('revenuePerKg'),
    },
    customers: {
      id: 'customers',
      title: t('analytics_active_customers'),
      value: number(kpis.customers),
      icon: Users,
      color: 'text-expresso',
      change: delta('customers'),
    },
    unpaid: {
      id: 'unpaid',
      title: t('analytics_unpaid'),
      value: money(report.receivables.total),
      mobileValue: shortMoney(report.receivables.total),
      subtitle: fillTemplate(t('analytics_orders_count'), { count: number(report.receivables.orders) }),
      icon: Wallet,
      color: report.receivables.total > 0 ? 'text-coffee-fruit' : 'text-expresso',
    },
    roasting_revenue: {
      id: 'roasting_revenue',
      title: t('analytics_roasting_revenue'),
      value: money(roasting.revenue),
      mobileValue: shortMoney(roasting.revenue),
      subtitle: `${kg(roasting.roastedGrams)} ${t('analytics_roasting_roasted')}`,
      icon: Flame,
      color: 'text-coffee-fruit',
    },
    roasting_jobs: {
      id: 'roasting_jobs',
      title: t('analytics_roasting_jobs'),
      value: number(roasting.jobs),
      icon: Hammer,
      color: 'text-warm-roast',
    },
  }
  const cardsConfig = Object.fromEntries(
    Object.entries(baseCards).map(([id, card]) => [
      id,
      { ...card, className: cardClass, changeLabel: card.change === undefined ? undefined : changeLabel },
    ])
  )

  // Filter state
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'all'>('all')
  const [fulfillmentFilter, setFulfillmentFilter] = useState<FulfillmentStatus | 'all'>('all')
  const [coffeeFilter, setCoffeeFilter] = useState<string>('all')

  // Keeps the last good dataset on failure.
  const load = (filters: AnalyticsFilters) => {
    startTransition(async () => {
      try {
        const next = await fetchAnalyticsDataset({ ...filters, tzOffsetMinutes: new Date().getTimezoneOffset() })
        setDataset(next)
        setLoaded(true)
        setLoadFailed(false)
      } catch {
        setLoadFailed(true)
        toast.error(t('analytics_load_failed'))
      }
    })
  }

  const loadCurrentMonth = () => {
    const month = currentMonth()
    setStartDate(month.startDate)
    setEndDate(month.endDate)
    setPaymentFilter('all')
    setFulfillmentFilter('all')
    setCoffeeFilter('all')
    load(month)
  }

  useEffect(() => {
    // Runs once on mount: the default range is the viewer's local month.
    /* eslint-disable react-hooks/set-state-in-effect */
    loadCurrentMonth()
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyFilters = () => {
    if (startDate && endDate && startDate > endDate) {
      toast.error(t('analytics_invalid_range'))
      return
    }
    load({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      paymentStatus: paymentFilter,
      fulfillmentStatus: fulfillmentFilter,
      coffeeId: coffeeFilter
    })
  }

  const clearFilters = loadCurrentMonth

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('analytics_title')}
        subtitle={t('analytics_subtitle_deep')}
        action={<ExportMenu dataset={dataset} report={report} disabled={isPending || !loaded} />}
      />

      {/* Filters */}
      <div className="bg-card/70 backdrop-blur-md border border-border rounded-xl p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          <div className="space-y-1.5 w-full min-w-0">
            <Label className="text-foreground text-xs font-bold">{t('filter_start_date')}</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-10 border-border focus-visible:ring-coffee-fruit text-sm w-full bg-background focus:bg-background transition-colors"
            />
          </div>
          <div className="space-y-1.5 w-full min-w-0">
            <Label className="text-foreground text-xs font-bold">{t('filter_end_date')}</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-10 border-border focus-visible:ring-coffee-fruit text-sm w-full bg-background focus:bg-background transition-colors"
            />
          </div>
          <div className="space-y-1.5 w-full min-w-0">
            <Label className="text-foreground text-xs font-bold">{t('filter_payment')}</Label>
            <Select value={paymentFilter} onValueChange={(val) => setPaymentFilter((val || 'all') as PaymentStatus | 'all')}>
              <SelectTrigger className="h-10 border-border focus:ring-coffee-fruit text-sm w-full bg-background focus:bg-background transition-colors">
                <SelectValue placeholder={t('filter_all')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filter_all')}</SelectItem>
                <SelectItem value="pending">{t('orders_pending')}</SelectItem>
                <SelectItem value="paid">{t('order_paid')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 w-full min-w-0">
            <Label className="text-foreground text-xs font-bold">{t('filter_fulfillment')}</Label>
            <Select value={fulfillmentFilter} onValueChange={(val) => setFulfillmentFilter((val || 'all') as FulfillmentStatus | 'all')}>
              <SelectTrigger className="h-10 border-border focus:ring-coffee-fruit text-sm w-full bg-background focus:bg-background transition-colors">
                <SelectValue placeholder={t('filter_all')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filter_all')}</SelectItem>
                <SelectItem value="pending">{t('orders_pending')}</SelectItem>
                <SelectItem value="roasted">{t('orders_roasted')}</SelectItem>
                <SelectItem value="delivered">{t('orders_delivered')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 w-full min-w-0">
            <Label className="text-foreground text-xs font-bold">{t('filter_coffee')}</Label>
            <Select
              value={coffeeFilter}
              onValueChange={(val) => setCoffeeFilter(String(val || 'all'))}
              items={[
                { value: 'all', label: t('filter_all') },
                ...coffeeOptions.map((c) => ({ value: c.id, label: c.item_name })),
                { value: 'none', label: t('analytics_coffee_none') },
              ]}
            >
              <SelectTrigger className="h-10 border-border focus:ring-coffee-fruit text-sm w-full bg-background focus:bg-background transition-colors">
                <SelectValue placeholder={t('filter_all')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filter_all')}</SelectItem>
                {coffeeOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.item_name}</SelectItem>
                ))}
                <SelectItem value="none">{t('analytics_coffee_none')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 w-full sm:col-span-2 lg:col-span-1">
            <Button
              onClick={applyFilters}
              disabled={isPending}
              className="h-10 bg-coffee-fruit hover:bg-warm-roast text-white flex-1 transition-colors shadow-sm"
              size="default"
            >
              {isPending ? t('loading') : t('filter_apply')}
            </Button>
            <Button
              onClick={clearFilters}
              disabled={isPending}
              variant="outline"
              className="h-10 text-expresso border-warm-roast/30 hover:bg-warm-roast/5 flex-1 transition-colors"
              size="default"
            >
              {t('filter_clear')}
            </Button>
          </div>
        </div>
      </div>

      {!loaded ? (
        loadFailed && !isPending ? <LoadError onRetry={applyFilters} /> : <PageSkeleton rows={3} />
      ) : (
      <div className={cn('space-y-6 transition-opacity', isPending && 'opacity-60')} aria-busy={isPending}>
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
            <div className="grid grid-cols-12 gap-3 sm:gap-4">
              {cardOrder.map((id) => {
                const config = cardsConfig[id]
                return config ? <SortableStatCard key={config.id} {...config} /> : null
              })}
            </div>
          </SortableContext>
          <DragOverlay adjustScale={false}>
            {activeId && cardsConfig[activeId] ? (
              <div className="w-full h-full opacity-90 cursor-grabbing shadow-2xl rounded-xl ring-2 ring-coffee-fruit/20">
                <StatCard {...cardsConfig[activeId]} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="grid grid-cols-12 gap-3 sm:gap-4">
          {DEFAULT_CARD_ORDER.map((id) => {
            const config = cardsConfig[id]
            return config ? (
              <div key={config.id} className={config.className}>
                <StatCard {...config} />
              </div>
            ) : null
          })}
        </div>
      )}

      <Tabs defaultValue="overview" className="w-full space-y-6">
        <TabsList className="bg-card border border-warm-roast/10 rounded-xl p-1 h-auto group-data-horizontal/tabs:h-auto w-full grid grid-cols-2 sm:flex sm:flex-row gap-1 max-w-full sm:max-w-[640px]">
          <TabsTrigger value="overview" className={TAB_TRIGGER}>
            <LayoutDashboard className="w-4 h-4 mr-1 shrink-0" />
            <span className="truncate">{t('analytics_tab_overview')}</span>
          </TabsTrigger>
          <TabsTrigger value="products" className={TAB_TRIGGER}>
            <ShoppingBag className="w-4 h-4 mr-1 shrink-0" />
            <span className="truncate">{t('analytics_tab_products')}</span>
          </TabsTrigger>
          <TabsTrigger value="customers" className={TAB_TRIGGER}>
            <UserRound className="w-4 h-4 mr-1 shrink-0" />
            <span className="truncate">{t('analytics_tab_customers')}</span>
          </TabsTrigger>
          <TabsTrigger value="operations" className={TAB_TRIGGER}>
            <Settings2 className="w-4 h-4 mr-1 shrink-0" />
            <span className="truncate">{t('analytics_tab_operations')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <InsightsPanel insights={report.insights} format={format} />
          <RevenueChart data={report.trend} granularity={report.granularity} format={format} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CoffeesSoldCard coffees={report.mix.coffee} format={format} />
            <ChannelCard channel={report.channel} format={format} />
          </div>
          <WeekdayChart data={report.weekdays} format={format} />
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <ProductMix mix={report.mix} format={format} />
          <CostStructure costs={report.costs} costPerKg={kpis.costPerKg} format={format} />
        </TabsContent>

        <TabsContent value="customers">
          <CustomerInsights customers={report.customers} format={format} />
        </TabsContent>

        <TabsContent value="operations">
          <OperationsPanel report={report} format={format} />
        </TabsContent>
      </Tabs>
      </div>
      )}
    </div>
  )
}
