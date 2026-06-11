'use client'

import { useState } from 'react'
import { useOrders, useCustomers, useInventory, useSettings, useRoastingOrders } from '@/hooks/queries'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Plus, Briefcase, Users, ShoppingCart, Calculator, Flame } from 'lucide-react'
import { OrderForm } from '@/components/OrderForm'
import { TableRowSkeleton } from '@/components/Skeletons'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InvitePartnerDialog } from '@/components/InvitePartnerDialog'
import { PartnersList } from '@/components/PartnersList'
import { OrderDetailsModal } from '@/components/OrderDetailsModal'
import { RoastingOrderDetailsModal } from '@/components/RoastingOrderDetailsModal'
import { GenericModal } from '@/components/ui/GenericModal'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCurrency, formatCRC, formatKg } from '@/lib/format'
import { useTranslation } from '@/i18n/LanguageProvider'
import type { DictionaryKey } from '@/i18n/dictionaries'

export default function B2BPage() {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const { t } = useTranslation()
  
  const { data: orders, isLoading: loadingOrders } = useOrders()
  const { data: customers, isLoading: loadingCustomers } = useCustomers()
  const { data: inventoryItems, isLoading: loadingInventory } = useInventory()
  const { data: settings } = useSettings()
  const { data: roastingOrders, isLoading: loadingRoasting } = useRoastingOrders()

  const isLoading = loadingOrders || loadingCustomers || loadingInventory

  const coffeeInventory = (inventoryItems || []).filter(item => item.category === 'green_coffee')
  
  // Filter for B2B orders (those with a partner_id or company_name)
  const b2bOrders = (orders || []).filter(o => !!o.company_name || !!o.partner_id)

  // Calculate Roast-to-Order Schedule (aggregate pending B2B orders by inventory_id)
  const pendingB2B = b2bOrders.filter(o => o.fulfillment_status === 'pending')
  const scheduleData = pendingB2B.reduce((acc, order) => {
    if (order.inventory_id) {
      acc[order.inventory_id] = (acc[order.inventory_id] || 0) + order.amount_grams
    }
    return acc
  }, {} as Record<string, number>)

  const roastLoss = settings?.roast_loss_percentage ?? 20

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={t('b2b_title') || "Wholesale / B2B Portal"}
        subtitle={t('b2b_subtitle') || "Manage large orders for wholesale clients and generate roast schedules."}
        action={
          <div className="flex items-center gap-2">
            <InvitePartnerDialog />

            <GenericModal
              isOpen={isAddOpen}
              onOpenChange={setIsAddOpen}
              hideFooter={true}
              hideTitle={true}
              title="New B2B Order"
              contentClassName="sm:max-w-[600px] p-0 border-none bg-transparent shadow-none max-h-[90vh] overflow-y-auto"
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

      <Tabs defaultValue="partners" className="w-full space-y-6">
        <TabsList className="bg-card border border-warm-roast/10 rounded-xl p-1 h-auto w-full flex flex-row gap-1 max-w-[540px]">
          <TabsTrigger value="partners" className="flex-1 rounded-lg data-[state=active]:bg-coffee-fruit/10 data-[state=active]:text-coffee-fruit text-expresso/70 transition-all py-2 text-xs sm:text-sm">
            <Users className="w-4 h-4 mr-1 shrink-0" />
            {t('b2b_partners_tab') || "Partners"}
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex-1 rounded-lg data-[state=active]:bg-coffee-fruit/10 data-[state=active]:text-coffee-fruit text-expresso/70 transition-all py-2 text-xs sm:text-sm">
            <ShoppingCart className="w-4 h-4 mr-1 shrink-0" />
            {t('b2b_orders_tab') || "Orders"}
          </TabsTrigger>
          <TabsTrigger value="roasting" className="flex-1 rounded-lg data-[state=active]:bg-coffee-fruit/10 data-[state=active]:text-coffee-fruit text-expresso/70 transition-all py-2 text-xs sm:text-sm">
            <Flame className="w-4 h-4 mr-1 shrink-0" />
            {t('b2b_roasting_tab')}
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex-1 rounded-lg data-[state=active]:bg-coffee-fruit/10 data-[state=active]:text-coffee-fruit text-expresso/70 transition-all py-2 text-xs sm:text-sm">
            <Calculator className="w-4 h-4 mr-1 shrink-0" />
            {t('b2b_schedule_tab') || "Schedule"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="partners" className="m-0 animate-in fade-in duration-300 outline-none">
          <PartnersList />
        </TabsContent>

        <TabsContent value="orders" className="m-0 animate-in fade-in duration-300 outline-none">
          <div className="bg-card rounded-xl shadow-sm shadow-warm-roast/5 border border-warm-roast/10 overflow-hidden">
            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col gap-4 p-4 bg-warm-roast/5">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-32 bg-card rounded-xl border border-warm-roast/10 animate-pulse" />
                ))
              ) : b2bOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-expresso/50">
                  <Briefcase className="h-8 w-8 opacity-20" />
                  <p>{t('b2b_no_orders')}</p>
                </div>
              ) : (
                b2bOrders.map((order) => (
                  <div key={order.id} className="flex flex-col bg-card rounded-xl border border-warm-roast/10 shadow-sm overflow-hidden">
                    <div className="flex items-start justify-between p-4 border-b border-warm-roast/5 bg-white-pergamino/30">
                      <div className="min-w-0">
                        <div className="font-bold text-coffee-fruit truncate">{order.company_name || t('b2b_client')}</div>
                        <div className="text-xs text-expresso/60 mt-0.5">{order.customers?.full_name}</div>
                      </div>
                      <StatusBadge tone={
                        order.fulfillment_status === 'delivered' ? 'success' :
                        order.fulfillment_status === 'roasted' ? 'accent' :
                        'info'
                      }>
                        {order.fulfillment_status}
                      </StatusBadge>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-expresso/50 mb-1">{t('common_coffee')}</div>
                        <div className="font-medium text-expresso">{order.inventory?.item_name || '—'}</div>
                        <div className="text-xs text-expresso/60 capitalize">{order.roast_level} • {new Date(order.order_date).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-expresso/50 mb-1">{t('common_amount')}</div>
                        <div className="font-medium text-expresso">{formatKg(order.amount_grams)}</div>
                        <div className="text-xs text-expresso/60">({t('common_bags').replace('{count}', String(order.bag_count))})</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-expresso/50 mb-1">{t('common_total')}</div>
                        <div className="font-bold text-warm-roast">{formatCurrency(order.total_price, settings)}</div>
                      </div>
                      <div className="flex items-end justify-end">
                        <GenericModal
                          hideFooter={true}
                          hideTitle={true}
                          title={t('b2b_order_details')}
                          contentClassName="sm:max-w-[480px] p-0 border-none bg-transparent shadow-none max-h-[90vh] overflow-y-auto"
                          trigger={
                            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 px-3 text-coffee-fruit hover:bg-warm-roast/5">
                              {t('edit')}
                            </button>
                          }
                        >
                          <OrderDetailsModal order={order} customers={customers || []} inventoryItems={coffeeInventory} settings={settings} />
                        </GenericModal>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[800px]">
                <thead className="text-xs text-expresso/60 uppercase bg-white-pergamino border-b border-warm-roast/10 font-bold tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-4">{t('common_company')}</th>
                    <th scope="col" className="px-6 py-4">{t('b2b_col_order_info')}</th>
                    <th scope="col" className="px-6 py-4">{t('common_coffee')}</th>
                    <th scope="col" className="px-6 py-4">{t('common_amount')}</th>
                    <th scope="col" className="px-6 py-4">{t('common_total')}</th>
                    <th scope="col" className="px-6 py-4">{t('common_status')}</th>
                    <th scope="col" className="px-6 py-4 text-right">{t('common_actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <TableRowSkeleton cols={7} rows={3} />
                  ) : b2bOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-expresso/50">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Briefcase className="h-8 w-8 opacity-20" />
                          <p>{t('b2b_no_orders')}</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    b2bOrders.map((order) => (
                      <tr key={order.id} className="bg-card border-b border-warm-roast/5 hover:bg-warm-roast/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-coffee-fruit">
                          {order.company_name || t('b2b_client')}
                          <div className="text-xs font-normal text-expresso/60 mt-0.5">
                            {order.customers?.full_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-expresso">
                          <div className="flex flex-col gap-0.5">
                            <span>{new Date(order.order_date).toLocaleDateString()}</span>
                            <span className="text-xs text-expresso/60 capitalize">{order.roast_level}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {order.inventory?.item_name || <span className="text-expresso/40">—</span>}
                        </td>
                        <td className="px-6 py-4 font-medium text-expresso">
                          {formatKg(order.amount_grams)}
                          <span className="text-xs text-expresso/60 ml-1">({t('common_bags').replace('{count}', String(order.bag_count))})</span>
                        </td>
                        <td className="px-6 py-4 font-bold text-warm-roast">
                          {formatCurrency(order.total_price, settings)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge tone={
                            order.fulfillment_status === 'delivered' ? 'success' :
                            order.fulfillment_status === 'roasted' ? 'accent' :
                            'info'
                          }>
                            {order.fulfillment_status}
                          </StatusBadge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <GenericModal
                            hideFooter={true}
                            hideTitle={true}
                            title={t('b2b_order_details')}
                            contentClassName="sm:max-w-[480px] p-0 border-none bg-transparent shadow-none max-h-[90vh] overflow-y-auto"
                            trigger={
                              <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3 text-expresso/70 hover:text-coffee-fruit hover:bg-warm-roast/5">
                                {t('edit')}
                              </button>
                            }
                          >
                            <OrderDetailsModal 
                              order={order} 
                              customers={customers || []} 
                              inventoryItems={coffeeInventory} 
                              settings={settings} 
                            />
                          </GenericModal>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="roasting" className="m-0 animate-in fade-in duration-300 outline-none">
          <div className="bg-card rounded-xl shadow-sm shadow-warm-roast/5 border border-warm-roast/10 overflow-hidden">
            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col gap-4 p-4 bg-warm-roast/5">
              {loadingRoasting ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-28 bg-card rounded-xl border border-warm-roast/10 animate-pulse" />
                ))
              ) : !roastingOrders || roastingOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-expresso/50">
                  <Flame className="h-8 w-8 opacity-20" />
                  <p>{t('roasting_roaster_empty')}</p>
                </div>
              ) : (
                roastingOrders.map((order) => (
                  <div key={order.id} className="flex flex-col bg-card rounded-xl border border-warm-roast/10 shadow-sm overflow-hidden">
                    <div className="flex items-start justify-between p-4 border-b border-warm-roast/5 bg-white-pergamino/30">
                      <div className="min-w-0">
                        <div className="font-bold text-coffee-fruit truncate">{order.b2b_partners?.company_name || t('roasting_unknown_partner')}</div>
                        <div className="text-xs text-expresso/60 mt-0.5">{new Date(order.created_at).toLocaleDateString()}</div>
                      </div>
                      <StatusBadge tone={
                        order.status === 'completed' ? 'success' :
                        order.status === 'accepted' ? 'accent' :
                        order.status === 'cancelled' ? 'danger' :
                        'info'
                      }>
                        {t(`roasting_status_${order.status}` as DictionaryKey)}
                      </StatusBadge>
                    </div>
                    <div className="p-4 flex items-center justify-between gap-3 text-sm">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-expresso/50 mb-1">{t('roasting_col_output')}</div>
                        <div className="font-medium text-expresso">{formatKg(order.roasted_grams_out)}</div>
                        <div className="text-xs text-expresso/60">({t('common_batches').replace('{count}', String(order.batches_needed))})</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-expresso/50 mb-1">{t('roasting_col_service_cost')}</div>
                        <div className="font-bold text-warm-roast">{formatCRC(order.total_cost)}</div>
                      </div>
                    </div>
                    <div className="px-4 pb-4">
                      <GenericModal
                        hideFooter={true}
                        hideTitle={true}
                        title={t('roasting_order_details')}
                        contentClassName="sm:max-w-[520px] p-0 border-none bg-transparent shadow-none max-h-[90vh] overflow-y-auto"
                        trigger={
                          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 px-3 w-full text-coffee-fruit hover:bg-warm-roast/5 border border-warm-roast/10">
                            {t('roasting_col_view')}
                          </button>
                        }
                      >
                        <RoastingOrderDetailsModal order={order} />
                      </GenericModal>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[800px]">
                <thead className="text-xs text-expresso/60 uppercase bg-white-pergamino border-b border-warm-roast/10 font-bold tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-4">{t('roasting_col_company')}</th>
                    <th scope="col" className="px-6 py-4">{t('roasting_col_date')}</th>
                    <th scope="col" className="px-6 py-4">{t('roasting_col_output')}</th>
                    <th scope="col" className="px-6 py-4">{t('roasting_col_service_cost')}</th>
                    <th scope="col" className="px-6 py-4">{t('roasting_col_status')}</th>
                    <th scope="col" className="px-6 py-4 text-right">{t('roasting_col_actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingRoasting ? (
                    <TableRowSkeleton cols={6} rows={3} />
                  ) : !roastingOrders || roastingOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-expresso/50">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Flame className="h-8 w-8 opacity-20" />
                          <p>{t('roasting_roaster_empty')}</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    roastingOrders.map((order) => (
                      <tr key={order.id} className="bg-card border-b border-warm-roast/5 hover:bg-warm-roast/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-coffee-fruit">
                          {order.b2b_partners?.company_name || t('roasting_unknown_partner')}
                        </td>
                        <td className="px-6 py-4 text-expresso">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-medium text-expresso">
                          {formatKg(order.roasted_grams_out)}
                          <span className="text-xs text-expresso/60 ml-1">({t('common_batches').replace('{count}', String(order.batches_needed))})</span>
                        </td>
                        <td className="px-6 py-4 font-bold text-warm-roast">
                          {formatCRC(order.total_cost)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge tone={
                            order.status === 'completed' ? 'success' :
                            order.status === 'accepted' ? 'accent' :
                            order.status === 'cancelled' ? 'danger' :
                            'info'
                          }>
                            {t(`roasting_status_${order.status}` as DictionaryKey)}
                          </StatusBadge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <GenericModal
                            hideFooter={true}
                            hideTitle={true}
                            title={t('roasting_order_details')}
                            contentClassName="sm:max-w-[520px] p-0 border-none bg-transparent shadow-none max-h-[90vh] overflow-y-auto"
                            trigger={
                              <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors h-9 px-3 text-expresso/70 hover:text-coffee-fruit hover:bg-warm-roast/5">
                                {t('roasting_col_view')}
                              </button>
                            }
                          >
                            <RoastingOrderDetailsModal order={order} />
                          </GenericModal>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
                  const greenCoffeeNeeded = amountNeeded / (1 - roastLoss / 100)
                  return (
                    <div key={invId} className="flex flex-col bg-white-pergamino/30 p-4 rounded-xl border border-warm-roast/10">
                      <span className="font-bold text-lg text-coffee-fruit">{inv?.item_name || t('b2b_unknown_bean')}</span>
                      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                        <div className="bg-card p-3 rounded-lg border border-warm-roast/5 shadow-sm">
                          <span className="block text-xs font-bold text-expresso/50 uppercase tracking-wider mb-1">{t('b2b_roasted_needed')}</span>
                          <span className="text-xl font-medium text-expresso">{(amountNeeded / 1000).toFixed(2)} <span className="text-sm">kg</span></span>
                        </div>
                        <div className="bg-card p-3 rounded-lg border border-warm-roast/5 shadow-sm">
                          <span className="block text-xs font-bold text-expresso/50 uppercase tracking-wider mb-1">{t('b2b_green_needed')}</span>
                          <span className="text-xl font-medium text-warm-roast">{(greenCoffeeNeeded / 1000).toFixed(2)} <span className="text-sm">kg</span></span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
