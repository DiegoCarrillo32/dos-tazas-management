'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OrderCard } from '@/components/OrderCard'
import type { OrderWithCustomer } from '@/types'

interface KanbanColumnProps {
  title: string
  items: OrderWithCustomer[]
  color: string
}

const KanbanColumn = ({ title, items, color }: KanbanColumnProps) => (
  <div className={`flex flex-col gap-4 p-4 rounded-xl border border-warm-roast/10 shadow-inner min-h-[500px] ${color}`}>
    <h2 className="font-heading text-xl text-expresso mb-2 flex justify-between items-center">
      {title} 
      <span className="text-sm font-sans bg-white-pergamino text-expresso shadow-sm px-3 py-1 rounded-full font-bold">
        {items.length}
      </span>
    </h2>
    <div className="flex flex-col gap-4">
      {items.map(order => <OrderCard key={order.id} order={order} />)}
      {items.length === 0 && (
        <div className="text-sm text-expresso/50 text-center py-12 border-2 border-dashed border-warm-roast/20 rounded-lg bg-white/50">
          No orders in this stage.
        </div>
      )}
    </div>
  </div>
)

export function OrdersBoard({ orders }: { orders: OrderWithCustomer[] }) {
  const pending = orders.filter(o => o.fulfillment_status === 'pending')
  const roasted = orders.filter(o => o.fulfillment_status === 'roasted')
  const delivered = orders.filter(o => o.fulfillment_status === 'delivered')

  return (
    <>
      {/* Mobile View: Tabs */}
      <div className="md:hidden">
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-expresso/5 p-1 rounded-xl">
            <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-900 rounded-lg transition-all">Pending</TabsTrigger>
            <TabsTrigger value="roasted" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-900 rounded-lg transition-all">Roasted</TabsTrigger>
            <TabsTrigger value="delivered" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-900 rounded-lg transition-all">Delivered</TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="mt-0 outline-none">
            <KanbanColumn title="Pending" items={pending} color="bg-yellow-50/50" />
          </TabsContent>
          <TabsContent value="roasted" className="mt-0 outline-none">
            <KanbanColumn title="Roasted" items={roasted} color="bg-orange-50/50" />
          </TabsContent>
          <TabsContent value="delivered" className="mt-0 outline-none">
            <KanbanColumn title="Delivered" items={delivered} color="bg-green-50/50" />
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop View: Kanban */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <KanbanColumn title="Pending" items={pending} color="bg-yellow-50/50" />
        <KanbanColumn title="Roasted" items={roasted} color="bg-orange-50/50" />
        <KanbanColumn title="Delivered" items={delivered} color="bg-green-50/50" />
      </div>
    </>
  )
}
