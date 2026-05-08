'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { updateFulfillmentStatus, updatePaymentStatus } from '@/actions/orders'
import { useState, useTransition } from 'react'
import { Coffee, Phone, User, Calendar, DollarSign, Maximize2 } from 'lucide-react'
import type { FulfillmentStatus, PaymentStatus, OrderWithCustomer, CustomerRecord, InventoryRecord, UserSettingsRecord } from '@/types'
import { OrderDetailsModal } from './OrderDetailsModal'

interface OrderCardProps {
  order: OrderWithCustomer
  customers: CustomerRecord[]
  inventoryItems: InventoryRecord[]
  settings?: UserSettingsRecord
}

export function OrderCard({ order, customers, inventoryItems, settings }: OrderCardProps) {
  const [isPending, startTransition] = useTransition()
  const [fulfillment, setFulfillment] = useState<FulfillmentStatus>(order.fulfillment_status)
  const [payment, setPayment] = useState<PaymentStatus>(order.payment_status)

  const handleFulfillmentToggle = () => {
    const nextStatus: Record<FulfillmentStatus, FulfillmentStatus> = {
      'pending': 'roasted',
      'roasted': 'delivered',
      'delivered': 'pending'
    }
    const newStatus = nextStatus[fulfillment]
    setFulfillment(newStatus)
    startTransition(async () => {
      await updateFulfillmentStatus(order.id, newStatus)
    })
  }

  const handlePaymentToggle = () => {
    const newStatus = payment === 'pending' ? 'paid' : 'pending'
    setPayment(newStatus)
    startTransition(async () => {
      await updatePaymentStatus(order.id, newStatus)
    })
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
                  {order.customers?.full_name || 'Unknown Customer'}
                </CardTitle>
                <p className="text-sm text-expresso/70 flex items-center gap-2 mt-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(order.order_date).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right mr-6">
                <div className="text-lg font-bold text-expresso">{settings?.currency_symbol || '$'}{Number(order.total_price).toFixed(2)}</div>
                <div className="text-xs text-expresso/60">{order.amount_grams}g</div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-4 grid gap-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-expresso">
                <Coffee className="h-4 w-4 text-warm-roast" />
                <span className="font-semibold">{order.roast_level}</span>
              </div>
              <div className="flex items-center gap-2 text-expresso">
                <span className="text-warm-roast font-bold text-lg leading-none">♨</span>
                <span className="font-semibold">{order.preparation_method}</span>
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
          disabled={isPending}
          className={`flex-1 transition-colors border-transparent ${fulfillmentColors[fulfillment]}`}
        >
          {fulfillment.charAt(0).toUpperCase() + fulfillment.slice(1)}
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handlePaymentToggle}
          disabled={isPending}
          className={`flex-1 transition-colors border-transparent ${paymentColors[payment]}`}
        >
          <DollarSign className="h-3.5 w-3.5 mr-1" />
          {payment === 'pending' ? 'Unpaid' : 'Paid'}
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
