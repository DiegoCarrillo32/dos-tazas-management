'use client'

import { useState } from 'react'
import { useOrders, useCustomers, useInventory, useSettings, useRoastingOrders } from '@/hooks/queries'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Plus, Briefcase, Users, ShoppingCart, Calculator, Flame } from 'lucide-react'
import { OrderForm } from '@/components/OrderForm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InvitePartnerDialog } from '@/components/InvitePartnerDialog'
import { PartnersList } from '@/components/PartnersList'
import { OrderDetailsModal } from '@/components/OrderDetailsModal'
import { RoastingOrderDetailsModal } from '@/components/RoastingOrderDetailsModal'
import { GenericModal } from '@/components/ui/GenericModal'
import { LoadError } from '@/components/LoadError'
import { StatusBadge } from '@/components/ui/status-badge'
import { ResponsiveList, type ResponsiveListColumn } from '@/components/ui/responsive-list'
import { formatCurrency, formatCRC, formatKg } from '@/lib/format'
import { aggregatePendingB2BOrders, calculateRawGrams, roastLossPercentage } from '@/utils/calculations'
import { useTranslation } from '@/i18n/LanguageProvider'
import type { DictionaryKey } from '@/i18n/dictionaries'
import type { OrderWithCustomer, RoastingOrderWithPartner } from '@/types'

export default function B2BPage() {
  const [isAddOpen, setIsAddOpen] = useState(false)
  // OrderDetailsModal needs an onClose to make its Close button (and the
  // post-delete dismiss) work, so these dialogs are controlled by order id.
  const [openOrderId, setOpenOrderId] = useState<string | null>(null)
  const { t } = useTranslation()
  
  const { data: orders, isLoading: loadingOrders, isError: ordersError, refetch: refetchOrders } = useOrders()
  const { data: customers, isLoading: loadingCustomers } = useCustomers()
  const { data: inventoryItems, isLoading: loadingInventory } = useInventory()
  const { data: settings } = useSettings()
  const { data: roastingOrders, isLoading: loadingRoasting, isError: roastingError, refetch: refetchRoasting } = useRoastingOrders()

  const isLoading = loadingOrders || loadingCustomers || loadingInventory

  const coffeeInventory = (inventoryItems || []).filter(item => item.category === 'green_coffee')
  
  // Filter for B2B orders (those with a partner_id or company_name)
  const b2bOrders = (orders || []).filter(o => !!o.company_name || !!o.partner_id)

  // Roast-to-Order Schedule: aggregate pending B2B orders by bean.
  const pendingB2B = b2bOrders.filter(o => o.fulfillment_status === 'pending')
  const scheduleData = aggregatePendingB2BOrders(b2bOrders)
  // Orders with no bean can't be scheduled — count them so the totals below
  // don't quietly under-report what still has to be roasted.
  const unscheduledCount = pendingB2B.filter(o => !o.inventory_id).length

  const roastLoss = settings ? roastLossPercentage(settings) : 20

  const fulfillmentLabel = (status: OrderWithCustomer['fulfillment_status']) =>
    status === 'delivered' ? t('orders_delivered')
      : status === 'roasted' ? t('orders_roasted')
        : t('orders_pending')

  const orderActions = (order: OrderWithCustomer) => (
    <GenericModal
      variant="bare"
      isOpen={openOrderId === order.id}
      onOpenChange={(open) => setOpenOrderId(open ? order.id : null)}
      title={t('b2b_order_details')}
      contentClassName="sm:max-w-[480px]"
      trigger={
        <Button variant="ghost" size="sm" className="text-expresso/70 hover:text-coffee-fruit hover:bg-warm-roast/5 max-md:min-h-11">
          {t('edit')}
        </Button>
      }
    >
      <OrderDetailsModal
        order={order}
        customers={customers || []}
        inventoryItems={coffeeInventory}
        settings={settings}
        onClose={() => setOpenOrderId(null)}
      />
    </GenericModal>
  )

  const orderColumns: ResponsiveListColumn<OrderWithCustomer>[] = [
    {
      id: 'company',
      role: 'title',
      header: t('common_company'),
      cell: (o) => (
        <>
          <span className="font-bold text-coffee-fruit">{o.company_name || t('b2b_client')}</span>
          <div className="text-xs font-normal text-expresso/60 mt-0.5">{o.customers?.full_name}</div>
        </>
      ),
      cardCell: (o) => o.company_name || t('b2b_client'),
    },
    {
      id: 'contact',
      role: 'meta',
      cardOnly: true,
      header: t('common_company'),
      cell: (o) => o.customers?.full_name,
    },
    {
      id: 'date',
      role: 'none',
      header: t('b2b_col_order_info'),
      cell: (o) => (
        <div className="flex flex-col gap-0.5 text-expresso">
          <span>{new Date(o.order_date).toLocaleDateString()}</span>
          <span className="text-xs text-expresso/60 capitalize">{o.roast_level}</span>
        </div>
      ),
    },
    {
      id: 'coffee',
      header: t('common_coffee'),
      cell: (o) => o.inventory?.item_name || <span className="text-expresso/40">—</span>,
      cardCell: (o) => (
        <>
          {o.inventory?.item_name || <span className="text-expresso/40">—</span>}
          <div className="text-xs font-normal text-expresso/60 capitalize">
            {o.roast_level} • {new Date(o.order_date).toLocaleDateString()}
          </div>
        </>
      ),
    },
    {
      id: 'amount',
      header: t('common_amount'),
      cell: (o) => (
        <>
          <span className="font-medium text-expresso">{formatKg(o.amount_grams)}</span>
          <span className="text-xs text-expresso/60 ml-1">
            ({t('common_bags').replace('{count}', String(o.bag_count))})
          </span>
        </>
      ),
    },
    {
      id: 'total',
      header: t('common_total'),
      cell: (o) => (
        <span className="font-bold text-warm-roast">{formatCurrency(o.total_price, settings)}</span>
      ),
    },
    {
      id: 'status',
      header: t('common_status'),
      cell: (o) => (
        <StatusBadge
          tone={
            o.fulfillment_status === 'delivered' ? 'success' :
            o.fulfillment_status === 'roasted' ? 'accent' :
            'info'
          }
        >
          {fulfillmentLabel(o.fulfillment_status)}
        </StatusBadge>
      ),
    },
  ]

  const roastingActions = (order: RoastingOrderWithPartner) => (
    <GenericModal
      variant="bare"
      title={t('roasting_order_details')}
      contentClassName="sm:max-w-[520px]"
      trigger={
        <Button variant="ghost" size="sm" className="text-expresso/70 hover:text-coffee-fruit hover:bg-warm-roast/5 max-md:min-h-11 max-md:w-full">
          {t('roasting_col_view')}
        </Button>
      }
    >
      <RoastingOrderDetailsModal order={order} />
    </GenericModal>
  )

  const roastingColumns: ResponsiveListColumn<RoastingOrderWithPartner>[] = [
    {
      id: 'company',
      role: 'title',
      header: t('roasting_col_company'),
      cell: (o) => (
        <span className="font-bold text-coffee-fruit">
          {o.b2b_partners?.company_name || t('roasting_unknown_partner')}
        </span>
      ),
      cardCell: (o) => o.b2b_partners?.company_name || t('roasting_unknown_partner'),
    },
    {
      id: 'date',
      role: 'meta',
      header: t('roasting_col_date'),
      cell: (o) => new Date(o.created_at).toLocaleDateString(),
    },
    {
      id: 'output',
      header: t('roasting_col_output'),
      cell: (o) => (
        <>
          <span className="font-medium text-expresso">{formatKg(o.roasted_grams_out)}</span>
          <span className="text-xs text-expresso/60 ml-1">
            ({t('common_batches').replace('{count}', String(o.batches_needed))})
          </span>
        </>
      ),
    },
    {
      id: 'cost',
      header: t('roasting_col_service_cost'),
      cell: (o) => <span className="font-bold text-warm-roast">{formatCRC(o.total_cost)}</span>,
    },
    {
      id: 'status',
      header: t('roasting_col_status'),
      cell: (o) => (
        <StatusBadge
          tone={
            o.status === 'completed' ? 'success' :
            o.status === 'accepted' ? 'accent' :
            o.status === 'cancelled' ? 'danger' :
            'info'
          }
        >
          {t(`roasting_status_${o.status}` as DictionaryKey)}
        </StatusBadge>
      ),
    },
  ]

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={t('b2b_title') || "Wholesale / B2B Portal"}
        subtitle={t('b2b_subtitle') || "Manage large orders for wholesale clients and generate roast schedules."}
        action={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-none">
            <InvitePartnerDialog />

            <GenericModal
              variant="bare"
              isOpen={isAddOpen}
              onOpenChange={setIsAddOpen}
              title="New B2B Order"
              contentClassName="sm:max-w-[600px]"
              trigger={
                <Button className="bg-card text-coffee-fruit hover:bg-warm-roast/10 border border-coffee-fruit/20 rounded-full px-6 shadow-sm transition-all">
                  <Plus className="mr-2 h-4 w-4" /> {t('orders_new') || "New B2B Order"}
                </Button>
              }
            >
              <OrderForm 
                customers={customers || []} 
                inventoryItems={coffeeInventory} 
                settings={settings} 
                isB2B={true}
                onSuccess={() => setIsAddOpen(false)}
                onCancel={() => setIsAddOpen(false)}
              />
            </GenericModal>
          </div>
        }
      />

      {(ordersError || roastingError) && (
        <LoadError onRetry={() => { refetchOrders(); refetchRoasting() }} />
      )}

      <Tabs defaultValue="partners" className="w-full space-y-6">
        <TabsList className="bg-card border border-warm-roast/10 rounded-xl p-1 h-auto group-data-horizontal/tabs:h-auto w-full grid grid-cols-2 sm:flex sm:flex-row gap-1 max-w-full sm:max-w-[540px]">
          <TabsTrigger value="partners" className="flex-1 min-w-0 rounded-lg data-[state=active]:bg-coffee-fruit/10 data-[state=active]:text-coffee-fruit text-expresso/70 transition-all py-2 text-xs sm:text-sm">
            <Users className="w-4 h-4 mr-1 shrink-0" />
            <span className="truncate">{t('b2b_partners_tab') || "Partners"}</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex-1 min-w-0 rounded-lg data-[state=active]:bg-coffee-fruit/10 data-[state=active]:text-coffee-fruit text-expresso/70 transition-all py-2 text-xs sm:text-sm">
            <ShoppingCart className="w-4 h-4 mr-1 shrink-0" />
            <span className="truncate">{t('b2b_orders_tab') || "Orders"}</span>
          </TabsTrigger>
          <TabsTrigger value="roasting" className="flex-1 min-w-0 rounded-lg data-[state=active]:bg-coffee-fruit/10 data-[state=active]:text-coffee-fruit text-expresso/70 transition-all py-2 text-xs sm:text-sm">
            <Flame className="w-4 h-4 mr-1 shrink-0" />
            <span className="truncate">{t('b2b_roasting_tab') || "Roasting"}</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex-1 min-w-0 rounded-lg data-[state=active]:bg-coffee-fruit/10 data-[state=active]:text-coffee-fruit text-expresso/70 transition-all py-2 text-xs sm:text-sm">
            <Calculator className="w-4 h-4 mr-1 shrink-0" />
            <span className="truncate">{t('b2b_schedule_tab') || "Schedule"}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="partners" className="m-0 animate-in fade-in duration-300 outline-none">
          <PartnersList />
        </TabsContent>

        <TabsContent value="orders" className="m-0 animate-in fade-in duration-300 outline-none">
          <div className="bg-card rounded-xl shadow-sm shadow-warm-roast/5 border border-warm-roast/10 overflow-hidden">
            <ResponsiveList
              data={b2bOrders}
              columns={orderColumns}
              rowKey={(o) => o.id}
              actions={orderActions}
              actionsHeader={t('common_actions')}
              isLoading={isLoading}
              caption={t('common_company')}
              emptyState={
                <div className="flex flex-col items-center justify-center gap-2">
                  <Briefcase className="h-8 w-8 opacity-20" />
                  <p>{t('b2b_no_orders')}</p>
                </div>
              }
            />

          </div>
        </TabsContent>

        <TabsContent value="roasting" className="m-0 animate-in fade-in duration-300 outline-none">
          <div className="bg-card rounded-xl shadow-sm shadow-warm-roast/5 border border-warm-roast/10 overflow-hidden">
            <ResponsiveList
              data={roastingOrders ?? []}
              columns={roastingColumns}
              rowKey={(o) => o.id}
              actions={roastingActions}
              actionsHeader={t('roasting_col_actions')}
              isLoading={loadingRoasting}
              caption={t('roasting_col_company')}
              emptyState={
                <div className="flex flex-col items-center justify-center gap-2">
                  <Flame className="h-8 w-8 opacity-20" />
                  <p>{t('roasting_roaster_empty')}</p>
                </div>
              }
            />

          </div>
        </TabsContent>

        <TabsContent value="schedule" className="m-0 animate-in fade-in duration-300 outline-none">
          <div className="bg-card rounded-xl shadow-sm shadow-warm-roast/5 border border-warm-roast/10 p-6 max-w-2xl">
            <h3 className="text-xl font-heading text-expresso border-b border-warm-roast/10 pb-4 mb-4">
              {t('b2b_schedule_title')}
            </h3>
            <p className="text-sm text-expresso/70 mb-6">
              {t('b2b_schedule_desc')}
            </p>
            {Object.keys(scheduleData).length === 0 ? (
              <div className="text-center p-8 border border-dashed border-warm-roast/20 rounded-xl text-expresso/50 bg-white-pergamino/50">
                <Calculator className="h-10 w-10 mx-auto opacity-20 mb-3" />
                {t('b2b_schedule_empty')}
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(scheduleData).map(([invId, amountNeeded]) => {
                  const inv = coffeeInventory.find(i => i.id === invId)
                  const greenCoffeeNeeded = calculateRawGrams(amountNeeded, roastLoss)
                  const stockGrams = inv?.stock_grams ?? 0
                  const shortfall = greenCoffeeNeeded - stockGrams
                  return (
                    <div key={invId} className="flex flex-col bg-white-pergamino/30 p-4 rounded-xl border border-warm-roast/10">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-lg text-coffee-fruit">{inv?.item_name || t('b2b_unknown_bean')}</span>
                        {shortfall > 0 && (
                          <StatusBadge tone="danger">
                            {t('b2b_schedule_short').replace('{amount}', formatKg(shortfall))}
                          </StatusBadge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-3 text-sm">
                        <div className="bg-card p-3 rounded-lg border border-warm-roast/5 shadow-sm">
                          <span className="block text-xs font-bold text-expresso/50 uppercase tracking-wider mb-1">{t('b2b_roasted_needed')}</span>
                          <span className="text-xl font-medium text-expresso">{(amountNeeded / 1000).toFixed(2)} <span className="text-sm">kg</span></span>
                        </div>
                        <div className="bg-card p-3 rounded-lg border border-warm-roast/5 shadow-sm">
                          <span className="block text-xs font-bold text-expresso/50 uppercase tracking-wider mb-1">{t('b2b_green_needed')}</span>
                          <span className="text-xl font-medium text-warm-roast">{(greenCoffeeNeeded / 1000).toFixed(2)} <span className="text-sm">kg</span></span>
                        </div>
                        <div className="bg-card p-3 rounded-lg border border-warm-roast/5 shadow-sm">
                          <span className="block text-xs font-bold text-expresso/50 uppercase tracking-wider mb-1">{t('b2b_schedule_stock')}</span>
                          <span className={`text-xl font-medium ${shortfall > 0 ? 'text-red-600 dark:text-red-400' : 'text-expresso'}`}>
                            {(stockGrams / 1000).toFixed(2)} <span className="text-sm">kg</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {unscheduledCount > 0 && (
              <p className="mt-4 text-xs text-expresso/60">
                {t('b2b_schedule_unassigned').replace('{count}', String(unscheduledCount))}
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
