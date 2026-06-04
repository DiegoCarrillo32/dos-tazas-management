'use client'

import { useState } from 'react'
import { useOrders, useCustomers, useInventory, useSettings } from '@/hooks/queries'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Plus, Briefcase, Users, ShoppingCart, Calculator } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { OrderForm } from '@/components/OrderForm'
import { TableRowSkeleton } from '@/components/Skeletons'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InvitePartnerDialog } from '@/components/InvitePartnerDialog'
import { PartnersList } from '@/components/PartnersList'
import { OrderDetailsModal } from '@/components/OrderDetailsModal'
import { useTranslation } from '@/i18n/LanguageProvider'

export default function B2BPage() {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const { t } = useTranslation()
  
  const { data: orders, isLoading: loadingOrders } = useOrders()
  const { data: customers, isLoading: loadingCustomers } = useCustomers()
  const { data: inventoryItems, isLoading: loadingInventory } = useInventory()
  const { data: settings } = useSettings()

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

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger render={
                <Button className="bg-white text-coffee-fruit hover:bg-warm-roast/10 border border-coffee-fruit/20 rounded-full px-6 shadow-sm transition-all" />
              }>
                <Plus className="mr-2 h-4 w-4" /> {t('orders_new') || "New B2B Order"}
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] p-0 border-none bg-transparent shadow-none max-h-[90vh] overflow-y-auto">
                <DialogTitle className="sr-only">New B2B Order</DialogTitle>
                <OrderForm 
                  customers={customers || []} 
                  inventoryItems={coffeeInventory} 
                  settings={settings} 
                  isB2B={true}
                  onSuccess={() => setIsAddOpen(false)}
                  onCancel={() => setIsAddOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <Tabs defaultValue="partners" className="w-full space-y-6">
        <TabsList className="bg-white border border-warm-roast/10 rounded-xl p-1 h-auto w-full flex flex-row gap-1 max-w-[400px]">
          <TabsTrigger value="partners" className="flex-1 rounded-lg data-[state=active]:bg-coffee-fruit/10 data-[state=active]:text-coffee-fruit text-expresso/70 transition-all py-2 text-xs sm:text-sm">
            <Users className="w-4 h-4 mr-1 shrink-0" />
            {t('b2b_partners_tab') || "Partners"}
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex-1 rounded-lg data-[state=active]:bg-coffee-fruit/10 data-[state=active]:text-coffee-fruit text-expresso/70 transition-all py-2 text-xs sm:text-sm">
            <ShoppingCart className="w-4 h-4 mr-1 shrink-0" />
            {t('b2b_orders_tab') || "Orders"}
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
          <div className="bg-white rounded-xl shadow-sm shadow-warm-roast/5 border border-warm-roast/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[800px]">
                <thead className="text-xs text-expresso/60 uppercase bg-white-pergamino border-b border-warm-roast/10 font-semibold tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-4">Company</th>
                    <th scope="col" className="px-6 py-4">Order Info</th>
                    <th scope="col" className="px-6 py-4">Coffee</th>
                    <th scope="col" className="px-6 py-4">Amount</th>
                    <th scope="col" className="px-6 py-4">Total</th>
                    <th scope="col" className="px-6 py-4">Status</th>
                    <th scope="col" className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <TableRowSkeleton cols={6} rows={3} />
                  ) : b2bOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-expresso/50">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Briefcase className="h-8 w-8 opacity-20" />
                          <p>No B2B orders found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    b2bOrders.map((order) => (
                      <tr key={order.id} className="bg-white border-b border-warm-roast/5 hover:bg-warm-roast/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-coffee-fruit">
                          {order.company_name || 'B2B Client'}
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
                          {(order.amount_grams / 1000).toFixed(2)} kg
                          <span className="text-xs text-expresso/60 ml-1">({order.bag_count} bags)</span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-warm-roast">
                          {settings?.currency_symbol || '$'}{Number(order.total_price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                            order.fulfillment_status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.fulfillment_status === 'roasted' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {order.fulfillment_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Dialog>
                            <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 text-expresso/70 hover:text-coffee-fruit hover:bg-warm-roast/5">
                                Edit
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[480px] p-0 border-none bg-transparent shadow-none max-h-[90vh] overflow-y-auto" closeButtonClassName="text-white/70 hover:text-white hover:bg-white/10">
                              <DialogTitle className="sr-only">Order Details</DialogTitle>
                              <OrderDetailsModal 
                                order={order} 
                                customers={customers || []} 
                                inventoryItems={coffeeInventory} 
                                settings={settings} 
                              />
                            </DialogContent>
                          </Dialog>
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
          <div className="bg-white rounded-xl shadow-sm shadow-warm-roast/5 border border-warm-roast/10 p-6 max-w-2xl">
            <h3 className="text-xl font-heading text-expresso border-b border-warm-roast/10 pb-4 mb-4">
              Roast-to-Order Schedule
            </h3>
            <p className="text-sm text-expresso/70 mb-6">
              Aggregated pending B2B orders to calculate how much green coffee needs to be roasted today.
            </p>
            {Object.keys(scheduleData).length === 0 ? (
              <div className="text-center p-8 border border-dashed border-warm-roast/20 rounded-xl text-expresso/50 bg-white-pergamino/50">
                <Calculator className="h-10 w-10 mx-auto opacity-20 mb-3" />
                No pending B2B orders require roasting right now.
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(scheduleData).map(([invId, amountNeeded]) => {
                  const inv = coffeeInventory.find(i => i.id === invId)
                  const greenCoffeeNeeded = amountNeeded / (1 - roastLoss / 100)
                  return (
                    <div key={invId} className="flex flex-col bg-white-pergamino/30 p-4 rounded-xl border border-warm-roast/10">
                      <span className="font-bold text-lg text-coffee-fruit">{inv?.item_name || 'Unknown Bean'}</span>
                      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                        <div className="bg-white p-3 rounded-lg border border-warm-roast/5 shadow-sm">
                          <span className="block text-xs font-bold text-expresso/50 uppercase tracking-wider mb-1">Roasted Needed</span>
                          <span className="text-xl font-medium text-expresso">{(amountNeeded / 1000).toFixed(2)} <span className="text-sm">kg</span></span>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-warm-roast/5 shadow-sm">
                          <span className="block text-xs font-bold text-expresso/50 uppercase tracking-wider mb-1">Green Needed</span>
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
