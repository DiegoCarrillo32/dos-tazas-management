'use client'
import { useState } from 'react'
import { OrderCard } from '@/components/OrderCard'
import type { OrderWithCustomer, CustomerRecord, InventoryRecord, UserSettingsRecord, FulfillmentStatus } from '@/types'
import { useTranslation } from '@/i18n/LanguageProvider'
import { DndContext, useSensor, useSensors, PointerSensor, DragEndEvent, useDroppable } from '@dnd-kit/core'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { useUpdateFulfillment } from '@/hooks/queries'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ColumnBodyProps {
  title: string
  items: OrderWithCustomer[]
  customers: CustomerRecord[]
  inventoryItems: InventoryRecord[]
  settings?: UserSettingsRecord
  color: string
  emptyText: string
}

/** The column's contents. Knows nothing about dropping — see DroppableColumn. */
const ColumnBody = ({ title, items, customers, inventoryItems, settings, color, emptyText, isOver = false }: ColumnBodyProps & { isOver?: boolean }) => (
  <div
    className={cn(
      'flex flex-col gap-4 p-4 rounded-xl border transition-all duration-200 shadow-inner min-h-[500px]',
      isOver
        ? 'border-coffee-fruit bg-coffee-fruit/5 ring-2 ring-coffee-fruit/20 scale-[1.01]'
        : cn('border-warm-roast/10', color)
    )}
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

/**
 * Only the desktop board is droppable. The mobile branch renders ColumnBody
 * directly: it sits outside the DndContext, so calling useDroppable there was a
 * silent no-op that merely looked like it worked.
 */
const DroppableColumn = ({ status, ...props }: ColumnBodyProps & { status: FulfillmentStatus }) => {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <div ref={setNodeRef}>
      <ColumnBody {...props} isOver={isOver} />
    </div>
  )
}

export function OrdersBoard({ orders, customers, inventoryItems, settings }: { orders: OrderWithCustomer[], customers: CustomerRecord[], inventoryItems: InventoryRecord[], settings?: UserSettingsRecord }) {
  const { t } = useTranslation()
  const [activeStatus, setActiveStatus] = useState<FulfillmentStatus>('pending')

  const byStatus: Record<FulfillmentStatus, OrderWithCustomer[]> = {
    pending: orders.filter(o => o.fulfillment_status === 'pending'),
    roasted: orders.filter(o => o.fulfillment_status === 'roasted'),
    delivered: orders.filter(o => o.fulfillment_status === 'delivered'),
  }

  const columns: { status: FulfillmentStatus; title: string; color: string }[] = [
    { status: 'pending', title: t('orders_pending'), color: 'bg-yellow-50/50 dark:bg-yellow-950/10' },
    { status: 'roasted', title: t('orders_roasted'), color: 'bg-orange-50/50 dark:bg-orange-950/10' },
    { status: 'delivered', title: t('orders_delivered'), color: 'bg-green-50/50 dark:bg-green-950/10' },
  ]

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
        fulfillmentMutation.mutate({ id: orderId, status: newStatus }, {
          onError: () => toast.error(t('order_update_failed')),
        })
      }
    }
  }

  return (
    <>
      {/* Mobile: one column at a time, picked from a segmented control. */}
      <div className="md:hidden">
        <div
          role="tablist"
          aria-label={t('orders_title')}
          className="mb-6 flex w-full gap-1 rounded-full border border-warm-roast/10 bg-card p-1"
        >
          {columns.map(({ status, title }) => {
            const isActive = activeStatus === status
            return (
              <button
                key={status}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveStatus(status)}
                className={cn(
                  'flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-2 text-xs font-bold transition-all',
                  isActive
                    ? 'bg-white-pergamino text-expresso shadow-sm'
                    : 'text-expresso/60 hover:text-expresso'
                )}
              >
                <span className="truncate">{title}</span>
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px]',
                    isActive ? 'bg-coffee-fruit text-white' : 'bg-warm-roast/10 text-expresso/70'
                  )}
                >
                  {byStatus[status].length}
                </span>
              </button>
            )
          })}
        </div>

        {columns
          .filter(({ status }) => status === activeStatus)
          .map(({ status, title, color }) => (
            <ColumnBody
              key={status}
              title={title}
              color={color}
              emptyText={t('orders_no_stage_orders')}
              items={byStatus[status]}
              customers={customers}
              inventoryItems={inventoryItems}
              settings={settings}
            />
          ))}
      </div>

      {/* Desktop: the full board, with drag between columns. */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd} modifiers={[restrictToWindowEdges]}>
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          {columns.map(({ status, title, color }) => (
            <DroppableColumn
              key={status}
              status={status}
              title={title}
              color={color}
              emptyText={t('orders_no_stage_orders')}
              items={byStatus[status]}
              customers={customers}
              inventoryItems={inventoryItems}
              settings={settings}
            />
          ))}
        </div>
      </DndContext>
    </>
  )
}
