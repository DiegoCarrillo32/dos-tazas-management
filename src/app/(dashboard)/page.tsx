import { fetchOrders } from '@/actions/orders'
import { fetchCustomers } from '@/actions/customers'
import { fetchInventory } from '@/actions/inventory'
import { fetchSettings } from '@/actions/settings'
import { OrdersBoard } from '@/components/OrdersBoard'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { OrderForm } from '@/components/OrderForm'

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const [orders, customers, inventoryItems, settings] = await Promise.all([
    fetchOrders(),
    fetchCustomers(),
    fetchInventory(),
    fetchSettings()
  ])

  // Filter only green coffee for orders
  const coffeeInventory = inventoryItems.filter(item => item.category === 'green_coffee')

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-heading text-expresso">Orders</h1>
          <p className="text-expresso/70 font-medium text-sm">Manage pending, roasted, and delivered orders.</p>
        </div>
        
        <Dialog>
          <DialogTrigger render={<Button className="bg-warm-roast hover:bg-coffee-fruit text-white gap-2 shadow-sm rounded-full px-6" />}>
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline font-bold">New Order</span>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px] p-0 border-none bg-transparent shadow-none" aria-describedby="new-order-form">
            <DialogTitle className="sr-only">Create New Order</DialogTitle>
            <OrderForm customers={customers} inventoryItems={coffeeInventory} settings={settings} />
          </DialogContent>
        </Dialog>
      </div>

      <OrdersBoard orders={orders} customers={customers} inventoryItems={coffeeInventory} settings={settings} />
    </div>
  )
}
