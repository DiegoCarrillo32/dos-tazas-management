'use client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OrderCard } from '@/components/OrderCard'
import type { OrderWithCustomer, CustomerRecord, InventoryRecord, UserSettingsRecord, FulfillmentStatus } from '@/types'
import { useTranslation } from '@/i18n/LanguageProvider'
import { DndContext, useSensor, useSensors, PointerSensor, DragEndEvent, useDroppable } from '@dnd-kit/core'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { useUpdateFulfillment } from '@/hooks/queries'

interface KanbanColumnProps {
  title: string
  items: OrderWithCustomer[]
  customers: CustomerRecord[]
  inventoryItems: InventoryRecord[]
  settings?: UserSettingsRecord
  color: string
  emptyText: string
  status: FulfillmentStatus
}

const KanbanColumn = ({ title, items, customers, inventoryItems, settings, color, emptyText, status }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  return (
    <div 
      ref={setNodeRef}
      className={`flex flex-col gap-4 p-4 rounded-xl border transition-all duration-200 shadow-inner min-h-[500px] ${
        isOver 
          ? 'border-coffee-fruit bg-coffee-fruit/5 ring-2 ring-coffee-fruit/20 scale-[1.01]' 
          : 'border-warm-roast/10 ' + color
      }`}
    >
      <h2 className="font-heading text-xl text-expresso mb-2 flex justify-between items-center">
        {title} 
        <span className="text-sm font-sans bg-white-pergamino text-expresso shadow-sm px-3 py-1 rounded-full font-bold">
          {items.length}
        </span>
      </h2>
      <div className="flex flex-col gap-4">
        {items.map(order => <OrderCard key={order.id} order={order} customers={customers} inventoryItems={inventoryItems} settings={settings} />)}
        {items.length === 0 && (
          <div className="text-sm text-expresso/50 text-center py-12 border-2 border-dashed border-warm-roast/20 rounded-lg bg-white/50 dark:bg-white/5">
            {emptyText}
          </div>
        )}
      </div>
    </div>
  )
}

export function OrdersBoard({ orders, customers, inventoryItems, settings }: { orders: OrderWithCustomer[], customers: CustomerRecord[], inventoryItems: InventoryRecord[], settings?: UserSettingsRecord }) {
  const { t } = useTranslation()
  const pending = orders.filter(o => o.fulfillment_status === 'pending')
  const roasted = orders.filter(o => o.fulfillment_status === 'roasted')
  const delivered = orders.filter(o => o.fulfillment_status === 'delivered')

  const fulfillmentMutation = useUpdateFulfillment()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id) {
      const orderId = active.id as string
      const newStatus = over.id as FulfillmentStatus
      
      const order = orders.find(o => o.id === orderId)
      if (order && order.fulfillment_status !== newStatus) {
        fulfillmentMutation.mutate({ id: orderId, status: newStatus })
      }
    }
  }

  return (
    <>
      {/* Mobile View: Tabs */}
      <div className="md:hidden">
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-expresso/5 p-1 rounded-xl">
            <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-900 dark:data-[state=active]:bg-yellow-950/40 dark:data-[state=active]:text-yellow-300 rounded-lg transition-all">{t('orders_pending')}</TabsTrigger>
            <TabsTrigger value="roasted" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-900 dark:data-[state=active]:bg-orange-950/40 dark:data-[state=active]:text-orange-300 rounded-lg transition-all">{t('orders_roasted')}</TabsTrigger>
            <TabsTrigger value="delivered" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-900 dark:data-[state=active]:bg-green-950/40 dark:data-[state=active]:text-green-300 rounded-lg transition-all">{t('orders_delivered')}</TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="mt-0 outline-none">
            <KanbanColumn title={t('orders_pending')} emptyText={t('orders_no_stage_orders')} items={pending} customers={customers} inventoryItems={inventoryItems} settings={settings} color="bg-yellow-50/50 dark:bg-yellow-950/10" status="pending" />
          </TabsContent>
          <TabsContent value="roasted" className="mt-0 outline-none">
            <KanbanColumn title={t('orders_roasted')} emptyText={t('orders_no_stage_orders')} items={roasted} customers={customers} inventoryItems={inventoryItems} settings={settings} color="bg-orange-50/50 dark:bg-orange-950/10" status="roasted" />
          </TabsContent>
          <TabsContent value="delivered" className="mt-0 outline-none">
            <KanbanColumn title={t('orders_delivered')} emptyText={t('orders_no_stage_orders')} items={delivered} customers={customers} inventoryItems={inventoryItems} settings={settings} color="bg-green-50/50 dark:bg-green-950/10" status="delivered" />
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop View: Kanban */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd} modifiers={[restrictToWindowEdges]}>
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          <KanbanColumn title={t('orders_pending')} emptyText={t('orders_no_stage_orders')} items={pending} customers={customers} inventoryItems={inventoryItems} settings={settings} color="bg-yellow-50/50 dark:bg-yellow-950/10" status="pending" />
          <KanbanColumn title={t('orders_roasted')} emptyText={t('orders_no_stage_orders')} items={roasted} customers={customers} inventoryItems={inventoryItems} settings={settings} color="bg-orange-50/50 dark:bg-orange-950/10" status="roasted" />
          <KanbanColumn title={t('orders_delivered')} emptyText={t('orders_no_stage_orders')} items={delivered} customers={customers} inventoryItems={inventoryItems} settings={settings} color="bg-green-50/50 dark:bg-green-950/10" status="delivered" />
        </div>
      </DndContext>
    </>
  )
}
