'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { useState } from 'react'
import { Coffee, Phone, User, Calendar, DollarSign, Maximize2 } from 'lucide-react'
import type { FulfillmentStatus, PaymentStatus, OrderWithCustomer, CustomerRecord, InventoryRecord, UserSettingsRecord } from '@/types'
import { OrderDetailsModal } from './OrderDetailsModal'
import { useTranslation } from '@/i18n/LanguageProvider'
import { useUpdateFulfillment, useUpdatePayment } from '@/hooks/queries'

interface OrderCardProps {
  order: OrderWithCustomer
  customers: CustomerRecord[]
  inventoryItems: InventoryRecord[]
  settings?: UserSettingsRecord
}

export function OrderCard({ order, customers, inventoryItems, settings }: OrderCardProps) {
  const { t } = useTranslation()
  const [fulfillment, setFulfillment] = useState<FulfillmentStatus>(order.fulfillment_status)
  const [payment, setPayment] = useState<PaymentStatus>(order.payment_status)

  const fulfillmentMutation = useUpdateFulfillment()
  const paymentMutation = useUpdatePayment()

  const handleFulfillmentToggle = () => {
    const nextStatus: Record<FulfillmentStatus, FulfillmentStatus> = {
      'pending': 'roasted',
      'roasted': 'delivered',
      'delivered': 'pending'
    }
    const newStatus = nextStatus[fulfillment]
    setFulfillment(newStatus)
    fulfillmentMutation.mutate({ id: order.id, status: newStatus })
  }

  const handlePaymentToggle = () => {
    const newStatus = payment === 'pending' ? 'paid' : 'pending'
    setPayment(newStatus)
    paymentMutation.mutate({ id: order.id, status: newStatus })
  }

  const fulfillmentColors: Record<FulfillmentStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    roasted: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
    delivered: 'bg-green-100 text-green-800 hover:bg-green-200'
  }

  const paymentColors: Record<PaymentStatus, string> = {
    pending: 'bg-red-100 text-red-800 hover:bg-red-200',
    paid: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
  }

  return (
    <Dialog>
      <Card className="w-full shadow-md hover:shadow-lg transition-shadow border-warm-roast/20 overflow-hidden group">
        <DialogTrigger render={<button type="button" className="cursor-pointer text-left w-full" />}>
          <CardHeader className="bg-white-pergamino border-b border-warm-roast/10 pb-4 relative">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-expresso/5 p-1.5 rounded-md">
              <Maximize2 className="h-4 w-4 text-expresso/50" />
            </div>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg font-heading text-expresso flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {order.customers?.full_name || t('order_unknown_customer')}
                </CardTitle>
                <p className="text-sm text-expresso/70 flex items-center gap-2 mt-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(order.order_date).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right mr-6">
                <div className="text-lg font-bold text-expresso">{settings?.currency_symbol || '$'}{Number(order.total_price).toFixed(2)}</div>
                <div className="text-xs text-expresso/60">{order.amount_grams}g</div>
                {order.total_cost != null && (
                  <div className="mt-1 flex items-center gap-1.5 justify-end">
                    <span className="text-[10px] font-bold text-expresso/50">{t('order_cost')}: {settings?.currency_symbol || '$'}{Number(order.total_cost).toFixed(2)}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${Number(order.total_price) - Number(order.total_cost) >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {Number(order.total_price) - Number(order.total_cost) >= 0 ? '+' : ''}{settings?.currency_symbol || '$'}{(Number(order.total_price) - Number(order.total_cost)).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-4 grid gap-2.5">
            {order.inventory?.item_name && (
              <div className="flex items-center gap-2 text-sm text-expresso bg-coffee-fruit/5 px-2.5 py-1.5 rounded-lg border border-coffee-fruit/10">
                <Coffee className="h-4 w-4 text-coffee-fruit" />
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs text-expresso/60 font-semibold">{t('order_form_coffee_bean').split(' (')[0]}:</span>
                  <span className="font-bold">{order.inventory.item_name}</span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-warm-roast/5 p-2 rounded-lg border border-warm-roast/10 flex flex-col justify-center">
                <span className="text-expresso/50 font-bold uppercase tracking-wider text-[10px]">{t('order_form_roast_level')}</span>
                <span className="font-semibold text-expresso mt-0.5">{order.roast_level}</span>
              </div>
              <div className="bg-warm-roast/5 p-2 rounded-lg border border-warm-roast/10 flex flex-col justify-center">
                <span className="text-expresso/50 font-bold uppercase tracking-wider text-[10px]">{t('order_form_preparation')}</span>
                <span className="font-semibold text-expresso mt-0.5">{order.preparation_method}</span>
              </div>
            </div>

            {order.customers?.phone && (
              <div className="flex items-center gap-2 text-sm text-expresso/80">
                <Phone className="h-3.5 w-3.5" />
                {order.customers.phone}
              </div>
            )}

            {order.origin_notes && (
              <div className="text-xs bg-warm-roast/5 p-2 rounded-md italic text-expresso/80 mt-1 border border-warm-roast/10">
                &ldquo;{order.origin_notes}&rdquo;
              </div>
            )}
          </CardContent>
        </DialogTrigger>

      <CardFooter className="bg-expresso/5 flex gap-2 pt-4 justify-between border-t border-warm-roast/10">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleFulfillmentToggle}
          disabled={fulfillmentMutation.isPending}
          className={`flex-1 transition-colors border-transparent ${fulfillmentColors[fulfillment]}`}
        >
          {fulfillment === 'pending' ? t('orders_pending') : fulfillment === 'roasted' ? t('orders_roasted') : t('orders_delivered')}
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handlePaymentToggle}
          disabled={paymentMutation.isPending}
          className={`flex-1 transition-colors border-transparent ${paymentColors[payment]}`}
        >
          <DollarSign className="h-3.5 w-3.5 mr-1" />
          {payment === 'pending' ? t('order_unpaid') : t('order_paid')}
        </Button>
      </CardFooter>

      <DialogContent className="sm:max-w-[480px] p-0 border-none bg-transparent shadow-none">
        <DialogTitle className="sr-only">Order Details</DialogTitle>
        <OrderDetailsModal order={order} customers={customers} inventoryItems={inventoryItems} settings={settings} />
      </DialogContent>
    </Card>
  </Dialog>
  )
}
