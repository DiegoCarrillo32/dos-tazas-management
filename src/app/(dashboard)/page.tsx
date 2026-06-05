'use client'

import { useOrders, useCustomers, useInventory, useSettings } from '@/hooks/queries'
import { OrdersBoard } from '@/components/OrdersBoard'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { OrderForm } from '@/components/OrderForm'
import { PageSkeleton } from '@/components/Skeletons'
import { useTranslation } from '@/i18n/LanguageProvider'
import { GenericModal } from '@/components/ui/GenericModal'

export default function OrdersPage() {
  const { t } = useTranslation()
  const { data: orders, isLoading: loadingOrders } = useOrders()
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-heading text-expresso">{t('orders_title')}</h1>
          <p className="text-expresso/70 font-medium text-sm">{t('orders_subtitle')}</p>
        </div>
        
        <GenericModal
          hideFooter={true}
          hideTitle={true}
          title={t('orders_create_new') || "Create New Order"}
          contentClassName="sm:max-w-[480px] p-0 border-none bg-transparent shadow-none max-h-[90vh] overflow-y-auto"
          trigger={
            <Button className="bg-warm-roast hover:bg-coffee-fruit text-white gap-2 shadow-sm rounded-full px-6">
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline font-bold">{t('orders_new')}</span>
            </Button>
          }
        >
          <OrderForm customers={customers || []} inventoryItems={coffeeInventory} settings={settings} />
        </GenericModal>
      </div>

      <OrdersBoard orders={orders || []} customers={customers || []} inventoryItems={coffeeInventory} settings={settings} />
    </div>
  )
}
