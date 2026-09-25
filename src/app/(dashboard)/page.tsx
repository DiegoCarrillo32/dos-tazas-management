'use client'

import { useOrders, useCustomers, useInventory, useSettings } from '@/hooks/queries'
import { OrdersBoard } from '@/components/OrdersBoard'
import { Button } from '@/components/ui/button'
import { Plus, FileDown } from 'lucide-react'
import { OrderForm } from '@/components/OrderForm'
import { PageSkeleton } from '@/components/Skeletons'
import { useTranslation } from '@/i18n/LanguageProvider'
import { GenericModal } from '@/components/ui/GenericModal'
import { PageHeader } from '@/components/PageHeader'
import { exportOrdersPdf } from '@/utils/exportOrdersPdf'
import { LoadError } from '@/components/LoadError'

export default function OrdersPage() {
  const { t } = useTranslation()
  const { data: orders, isLoading: loadingOrders, isError, refetch } = useOrders()
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
      <PageHeader
        title={t('orders_title')}
        subtitle={t('orders_subtitle')}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => exportOrdersPdf(orders || [], settings, t)}
              disabled={!orders || orders.length === 0}
              className="border-warm-roast/30 text-warm-roast hover:bg-warm-roast/5 gap-2 rounded-full px-6"
            >
              <FileDown className="h-5 w-5" />
              <span className="hidden sm:inline font-bold">{t('orders_export_pdf')}</span>
            </Button>
            <GenericModal
              variant="bare"
              title={t('orders_create_new') || "Create New Order"}
              contentClassName="sm:max-w-[480px]"
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
        }
      />

      {isError && <LoadError onRetry={() => refetch()} />}

      <OrdersBoard orders={orders || []} customers={customers || []} inventoryItems={coffeeInventory} settings={settings} />
    </div>
  )
}
