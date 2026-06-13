'use client'

import { useAllGreenCoffeeLots } from '@/hooks/queries'
import { Package, TrendingDown, AlertTriangle, Leaf } from 'lucide-react'
import { useTranslation } from '@/i18n/LanguageProvider'
import type { InventoryRecord } from '@/types'

interface InventorySummaryHeaderProps {
  items: InventoryRecord[]
}

export function InventorySummaryHeader({ items }: InventorySummaryHeaderProps) {
  const { t } = useTranslation()
  const { data: allLots } = useAllGreenCoffeeLots()

  const greenCoffeeItems = items.filter(i => i.category === 'green_coffee')

  const totalKg = allLots?.reduce((sum, l) => sum + (l.quantity_kg || 0), 0) ?? 0
  const shippedKg = allLots?.reduce((sum, l) => sum + (l.quantity_shipped_kg || 0), 0) ?? 0
  const availableKg = totalKg - shippedKg

  // Count items where available kg (across all their lots) is below the item's threshold
  const lowStockCount = (() => {
    if (!allLots) return 0
    return greenCoffeeItems.filter(item => {
      const itemLots = allLots.filter(l => l.inventory_id === item.id)
      if (itemLots.length === 0) return false
      const itemAvailable = itemLots.reduce((s, l) => s + (l.quantity_kg || 0) - (l.quantity_shipped_kg || 0), 0)
      const threshold = item.low_stock_threshold_kg ?? 5
      return itemAvailable < threshold
    }).length
  })()

  const totalLots = allLots?.length ?? 0

  const stats = [
    {
      label: t('inv_summary_items'),
      value: greenCoffeeItems.length,
      icon: Package,
      color: 'text-expresso',
      bg: 'bg-warm-roast/5',
    },
    {
      label: t('inv_summary_lots'),
      value: totalLots,
      icon: Leaf,
      color: 'text-coffee-fruit',
      bg: 'bg-coffee-fruit/5',
    },
    {
      label: t('inv_summary_available'),
      value: `${availableKg.toFixed(1)} kg`,
      icon: TrendingDown,
      color: 'text-expresso',
      bg: 'bg-warm-roast/5',
      sub: totalKg > 0 ? t('inv_summary_of_total').replace('{total}', totalKg.toFixed(1)) : undefined,
    },
    {
      label: t('inv_summary_low_stock'),
      value: lowStockCount,
      icon: AlertTriangle,
      color: lowStockCount > 0 ? 'text-red-500' : 'text-expresso/40',
      bg: lowStockCount > 0 ? 'bg-red-50 dark:bg-red-900/10' : 'bg-warm-roast/5',
      highlight: lowStockCount > 0,
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`${stat.bg} rounded-xl p-4 border ${stat.highlight ? 'border-red-200 dark:border-red-800' : 'border-warm-roast/10'} flex flex-col gap-1`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-expresso/50">{stat.label}</span>
            <stat.icon className={`h-4 w-4 ${stat.color} opacity-60`} />
          </div>
          <p className={`text-2xl font-bold font-heading ${stat.color}`}>{stat.value}</p>
          {stat.sub && <p className="text-[10px] text-expresso/40 font-medium">{stat.sub}</p>}
        </div>
      ))}
    </div>
  )
}
