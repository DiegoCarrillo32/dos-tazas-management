'use client'

import { useCompletedOrders, useCustomers, useInventory, useSettings } from '@/hooks/queries'
import { OrderCard } from '@/components/OrderCard'
import { History, CheckCircle } from 'lucide-react'
import { PageSkeleton } from '@/components/Skeletons'
import { useTranslation } from '@/i18n/LanguageProvider'

export default function HistoryPage() {
  const { t } = useTranslation()
  const { data: orders, isLoading: loadingOrders } = useCompletedOrders()
  const { data: customers, isLoading: loadingCustomers } = useCustomers()
  const { data: inventoryItems, isLoading: loadingInventory } = useInventory()
  const { data: settings } = useSettings()

  const isLoading = loadingOrders || loadingCustomers || loadingInventory

  if (isLoading) {
    return <PageSkeleton rows={3} />
  }

  const coffeeInventory = (inventoryItems || []).filter(item => item.category === 'green_coffee')

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-heading text-expresso flex items-center gap-3">
            <History className="h-8 w-8 text-coffee-fruit" />
            {t('history_title')}
          </h1>
          <p className="text-expresso/70 font-medium text-sm">{t('history_subtitle')}</p>
        </div>
      </div>

      {(orders || []).length === 0 ? (
        <div className="text-center py-20 bg-white-pergamino rounded-xl border-2 border-dashed border-warm-roast/20">
          <CheckCircle className="h-16 w-16 text-warm-roast/30 mx-auto mb-4" />
          <h3 className="text-xl font-heading text-expresso mb-2">{t('history_no_orders')}</h3>
          <p className="text-expresso/60">{t('history_no_orders_desc')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {(orders || []).map(order => (
            <OrderCard key={order.id} order={order} customers={customers || []} inventoryItems={coffeeInventory} settings={settings} />
          ))}
        </div>
      )}
    </div>
  )
}
