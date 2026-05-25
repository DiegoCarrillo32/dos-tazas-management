'use client'

import { useOrders, useCustomers, useInventory, useSettings } from '@/hooks/queries'
import { OrdersBoard } from '@/components/OrdersBoard'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { OrderForm } from '@/components/OrderForm'
import { PageSkeleton } from '@/components/Skeletons'
import { useTranslation } from '@/i18n/LanguageProvider'

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
        
        <Dialog>
          <DialogTrigger render={<Button className="bg-warm-roast hover:bg-coffee-fruit text-white gap-2 shadow-sm rounded-full px-6" />}>
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline font-bold">{t('orders_new')}</span>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px] p-0 border-none bg-transparent shadow-none max-h-[90vh] overflow-y-auto" aria-describedby="new-order-form">
            <DialogTitle className="sr-only">{t('orders_create_new')}</DialogTitle>
            <OrderForm customers={customers || []} inventoryItems={coffeeInventory} settings={settings} />
          </DialogContent>
        </Dialog>
      </div>

      <OrdersBoard orders={orders || []} customers={customers || []} inventoryItems={coffeeInventory} settings={settings} />
    </div>
  )
}
