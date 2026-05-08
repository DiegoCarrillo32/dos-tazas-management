import { fetchCompletedOrders } from '@/actions/orders'
import { fetchCustomers } from '@/actions/customers'
import { fetchInventory } from '@/actions/inventory'
import { fetchSettings } from '@/actions/settings'
import { OrderCard } from '@/components/OrderCard'
import { History, CheckCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const [orders, customers, inventoryItems, settings] = await Promise.all([
    fetchCompletedOrders(),
    fetchCustomers(),
    fetchInventory(),
    fetchSettings()
  ])

  const coffeeInventory = inventoryItems.filter(item => item.category === 'green_coffee')

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-heading text-expresso flex items-center gap-3">
            <History className="h-8 w-8 text-coffee-fruit" />
            Order History
          </h1>
          <p className="text-expresso/70 font-medium text-sm">View all completed (delivered and paid) orders.</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white-pergamino rounded-xl border-2 border-dashed border-warm-roast/20">
          <CheckCircle className="h-16 w-16 text-warm-roast/30 mx-auto mb-4" />
          <h3 className="text-xl font-heading text-expresso mb-2">No Completed Orders Yet</h3>
          <p className="text-expresso/60">Orders will appear here once they are marked as delivered and paid.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {orders.map(order => (
            <OrderCard key={order.id} order={order} customers={customers} inventoryItems={coffeeInventory} settings={settings} />
          ))}
        </div>
      )}
    </div>
  )
}
